import { json } from 'overmind';
import { Action } from '.';
import track, {
  identify,
  setUserId,
} from '@codesandbox/common/lib/utils/analytics';
import {
  Sandbox,
  User,
  CurrentUser,
  NotificationButton,
  Contributor,
} from '@codesandbox/common/lib/types';
import { AxiosError } from 'axios';

export const setKeybindings: Action = ({ state, effects }) => {
  effects.keybindingManager.set(
    json(state.preferences.settings.keybindings || [])
  );
};

export const setJwtFromStorage: Action = ({ effects, state }) => {
  state.jwt = effects.jwt.get() || null;
};

export const listenToConnectionChange: Action = ({ effects, actions }) => {
  effects.connection.addListener(actions.connectionChanged);
};

export const setStoredSettings: Action = ({ state, effects }) => {
  const settings = effects.settingsStore.getAll();

  if (settings.keybindings) {
    settings.keybindings = Object.keys(settings.keybindings).reduce(
      (value, key) =>
        value.concat({
          key,
          bindings: settings.keybindings[key],
        }),
      []
    );
  }

  Object.assign(state.preferences.settings, settings);
  // state.merge('preferences.settings', settings);
};

export const startKeybindings: Action = ({ effects }) => {
  effects.keybindingManager.start(event => {
    // Copy code from keybindingmanager
  });
};

export const getUser: Action<void, Promise<CurrentUser>> = ({ effects }) => {
  return effects.api.get('/users/current');
};

export const getSandbox: Action<string, Promise<Sandbox>> = (
  { effects },
  id
) => {
  return effects.api.get(`/sandboxes/${id}`);
};

export const setPatronPrice: Action = ({ state }) => {
  state.patron.price = state.user.subscription
    ? Number(state.user.subscription.amount)
    : 10;
};

export const setSignedInCookie: Action = ({ state }) => {
  document.cookie = 'signedIn=true; Path=/;';
  identify('signed_in', 'true');
  setUserId(state.user.id);
};

export const connectWebsocket: Action = ({ effects }) => {
  effects.socket.connect();
};

export const addNotification: Action<{
  title: string;
  type: 'notice' | 'success' | 'warning' | 'error';
  timeAlive?: number;
  buttons?: Array<NotificationButton>;
}> = ({ state }, { title, type, timeAlive, buttons }) => {
  const now = Date.now();
  const timeAliveDefault = type === 'error' ? 6 : 3;

  state.notifications.push({
    id: now,
    title,
    type,
    buttons,
    endTime: now + (timeAlive ? timeAlive : timeAliveDefault) * 1000,
  });
};

export const removeJwtFromStorage: Action = ({ effects }) => {
  effects.jwt.reset();
};

export const getContributors: Action = async ({ state, effects }) => {
  try {
    const response = await effects.http.get<{ contributors: Contributor[] }>(
      'https://raw.githubusercontent.com/CompuIves/codesandbox-client/master/.all-contributorsrc'
    );

    state.contributors = response.contributors.map(
      contributor => contributor.login
    );
  } catch (error) {}
};

export const authorize: Action = async ({ state, effects }) => {
  try {
    const data = await effects.api.get<{ token: string }>('/auth/auth-token');
    state.authToken = data.token;
  } catch (error) {
    state.editor.error = error.message;
  }
};

export const signInGithub: Action<
  { useExtraScopes: boolean },
  Promise<string>
> = ({ effects }, options) => {
  const popup = effects.browser.openPopup(
    `/auth/github${options.useExtraScopes ? '?scope=user:email,repo' : ''}`,
    'sign in'
  );

  return effects.browser
    .waitForMessage<{ jwt: string }>('signin')
    .then(data => {
      const jwt = data.jwt;

      popup.close();

      if (jwt) {
        return jwt;
      }

      throw new Error('Could not get sign in token');
    });
};

export const setJwt: Action<string> = ({ state, effects }, jwt) => {
  effects.jwt.set(jwt);
  state.jwt = jwt;
};

/*import axios from 'axios';

import { generateFileFromSandbox } from '@codesandbox/common/lib/templates/configuration/package-json';


import { parseConfigurations } from './utils/parse-configurations';
import { mainModule, defaultOpenedModule } from './utils/main-module';
import getItems from './modules/workspace/items';
*/

/*
export function callVSCodeCallback({ props }) {
  const { cbID } = props;
  if (cbID) {
    if (window.cbs && window.cbs[cbID]) {
      window.cbs[cbID](undefined, undefined);
      delete window.cbs[cbID];
    }
  }
}

export function callVSCodeCallbackError({ props }) {
  const { cbID } = props;
  if (cbID) {
    if (window.cbs && window.cbs[cbID]) {
      const errorMessage =
        props.message || 'Something went wrong while saving the file.';
      window.cbs[cbID](new Error(errorMessage), undefined);
      delete window.cbs[cbID];
    }
  }
}

export function setWorkspace({ controller, state, props }) {
  state.set('workspace.project.title', props.sandbox.title || '');
  state.set('workspace.project.description', props.sandbox.description || '');

  const items = getItems(controller.getState());
  const defaultItem = items.find(i => i.defaultOpen) || items[0];
  state.set(`workspace.openedWorkspaceItem`, defaultItem.id);
}

export function setUrlOptions({ state, router, utils }) {
  const options = router.getSandboxOptions();

  if (options.currentModule) {
    const sandbox = state.get('editor.currentSandbox');

    try {
      const module = utils.resolveModule(
        options.currentModule,
        sandbox.modules,
        sandbox.directories,
        options.currentModule.directoryShortid
      );

      if (module) {
        state.push('editor.tabs', {
          type: 'MODULE',
          moduleShortid: module.shortid,
          dirty: false,
        });
        state.set('editor.currentModuleShortid', module.shortid);
      }
    } catch (err) {
      const now = Date.now();
      const title = `Could not find the module ${options.currentModule}`;

      state.push('notifications', {
        title,
        id: now,
        notificationType: 'warning',
        endTime: now + 2000,
        buttons: [],
      });
    }
  }

  state.set(
    'preferences.showPreview',
    options.isPreviewScreen || options.isSplitScreen
  );
  state.set(
    'preferences.showEditor',
    options.isEditorScreen || options.isSplitScreen
  );

  if (options.initialPath) state.set('editor.initialPath', options.initialPath);
  if (options.fontSize)
    state.set('preferences.settings.fontSize', options.fontSize);
  if (options.highlightedLines)
    state.set('editor.highlightedLines', options.highlightedLines);
  if (options.hideNavigation)
    state.set('preferences.hideNavigation', options.hideNavigation);
  if (options.isInProjectView)
    state.set('editor.isInProjectView', options.isInProjectView);
  if (options.autoResize)
    state.set('preferences.settings.autoResize', options.autoResize);
  if (options.useCodeMirror)
    state.set('preferences.settings.useCodeMirror', options.useCodeMirror);
  if (options.enableEslint)
    state.set('preferences.settings.enableEslint', options.enableEslint);
  if (options.forceRefresh)
    state.set('preferences.settings.forceRefresh', options.forceRefresh);
  if (options.expandDevTools)
    state.set('preferences.showDevtools', options.expandDevTools);
  if (options.runOnClick)
    state.set(`preferences.runOnClick`, options.runOnClick);
}

export function setCurrentModuleShortid({ props, state }) {
  const currentModuleShortid = state.get('editor.currentModuleShortid');
  const sandbox = props.sandbox;

  // Only change the module shortid if it doesn't exist in the new sandbox
  if (
    sandbox.modules.map(m => m.shortid).indexOf(currentModuleShortid) === -1
  ) {
    const parsedConfigs = parseConfigurations(sandbox);
    const module = defaultOpenedModule(sandbox, parsedConfigs);

    state.set('editor.currentModuleShortid', module.shortid);
  }
}

export function setMainModuleShortid({ props, state }) {
  const sandbox = props.sandbox;
  const parsedConfigs = parseConfigurations(sandbox);
  const module = mainModule(sandbox, parsedConfigs);

  state.set('editor.mainModuleShortid', module.shortid);
}

export function setInitialTab({ state }) {
  const currentModule = state.get('editor.currentModule');
  const newTab = {
    type: 'MODULE',
    moduleShortid: currentModule.shortid,
    dirty: true,
  };

  state.set('editor.tabs', [newTab]);
}

export function getGitChanges({ api, state }) {
  const id = state.get('editor.currentId');

  return api
    .get(`/sandboxes/${id}/git/diff`)
    .then(gitChanges => ({ gitChanges }));
}

export function forkSandbox({ state, props, api }) {
  const sandboxId = props.sandboxId || state.get('editor.currentId');
  const url = sandboxId.includes('/')
    ? `/sandboxes/fork/${sandboxId}`
    : `/sandboxes/${sandboxId}/fork`;

  return api
    .post(url, props.body || {})
    .then(data => ({ forkedSandbox: data }));
}

export function moveModuleContent({ props, state }) {
  const currentSandbox = state.get('editor.currentSandbox');

  if (currentSandbox) {
    return {
      sandbox: Object.assign({}, props.forkedSandbox, {
        modules: props.forkedSandbox.modules.map(module =>
          Object.assign(module, {
            code: currentSandbox.modules.find(
              currentSandboxModule =>
                currentSandboxModule.shortid === module.shortid
            ).code,
          })
        ),
      }),
    };
  }

  return { sandbox: props.forkedSandbox };
}

export function closeTabByIndex({ state, props }) {
  const sandbox = state.get('editor.currentSandbox');
  const currentModule = state.get('editor.currentModule');
  const tabs = state.get('editor.tabs');
  const tabModuleId = tabs[props.tabIndex].moduleId;
  const isActiveTab = currentModule.id === tabModuleId;

  if (isActiveTab) {
    const newTab =
      props.tabIndex > 0 ? tabs[props.tabIndex - 1] : tabs[props.tabIndex + 1];

    if (newTab) {
      const newModule = sandbox.modules.find(
        module => module.id === newTab.moduleId
      );

      state.set('editor.currentModuleShortid', newModule.shortid);
    }
  }

  state.splice('editor.tabs', props.tabIndex, 1);
}



export function signOut({ api }) {
  api.delete(`/users/signout`);
}

export function getAuthToken({ api, path }) {
  return api
    .get('/auth/auth-token')
    .then(({ token }) => path.success({ token }))
    .catch(error => path.error({ error }));
}

export function setModal({ state, props }) {
  track('Open Modal', { modal: props.modal });
  state.set('currentModalMessage', props.message);
  state.set('currentModal', props.modal);
}

export function removeNotification({ state, props }) {
  const notifications = state.get('notifications');
  const notificationToRemoveIndex = notifications.findIndex(
    notification => notification.id === props.id
  );

  state.splice('notifications', notificationToRemoveIndex, 1);
}

export function setJwtFromProps({ jwt, state, props }) {
  jwt.set(props.jwt);
  state.set('jwt', props.jwt);
}






export function stopListeningToConnectionChange({ connection }) {
  connection.removeListener('connectionChanged');
}



export function signInZeit({ browser, path }) {
  const popup = browser.openPopup('/auth/zeit', 'sign in');
  return browser.waitForMessage('signin').then(data => {
    popup.close();

    if (data && data.code) {
      return path.success({ code: data.code });
    }

    return path.error();
  });
}

export function updateUserZeitDetails({ api, path, props }) {
  const { code } = props;

  return api
    .post(`/users/current_user/integrations/zeit`, {
      code,
    })
    .then(data => path.success({ user: data }))
    .catch(error => path.error({ error }));
}

export function getZeitIntegrationDetails({ state, path }) {
  const token = state.get(`user.integrations.zeit.token`);

  return axios
    .get('https://api.zeit.co/www/user', {
      headers: {
        Authorization: `bearer ${token}`,
      },
    })
    .then(response => path.success({ response: response.data }))
    .catch(error => path.error({ error }));
}

export function signOutZeit({ api }) {
  return api.delete(`/users/current_user/integrations/zeit`).then(() => {});
}

export function signOutGithubIntegration({ api }) {
  return api.delete(`/users/current_user/integrations/github`).then(() => {});
}

export function createPackageJSON({ props }) {
  const { sandbox } = props;

  const code = generateFileFromSandbox(sandbox);

  return {
    title: 'package.json',
    newCode: code,
  };
}


*/
