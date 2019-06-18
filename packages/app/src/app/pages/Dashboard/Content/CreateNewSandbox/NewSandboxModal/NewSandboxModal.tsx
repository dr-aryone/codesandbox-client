import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import track from '@codesandbox/common/lib/utils/analytics';
import Template from '@codesandbox/common/lib/components/Template';
import { useStore } from 'app/store';
import { ImportTab } from './ImportTab';
import { MyTemplates } from './MyTemplates';
import { MyTemplatesTab } from './MyTemplatesTab';
import {
  Container,
  InnerContainer,
  Templates,
  Tab,
  Button,
  TabContainer,
  Title,
} from './elements';
import { popular, client, container, presets } from './availableTemplates';

interface INewSandboxModalProps {
  forking: boolean;
  closing: boolean;
  createSandbox: Function;
}

export const NewSandboxModal: React.FunctionComponent<
  INewSandboxModalProps
> = observer(({ forking = false, closing = false, createSandbox }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const { user } = useStore();

  const selectTemplate = template => {
    track('New Sandbox Modal - Select Template', { template });
    createSandbox(template);
  };

  return (
    <Container
      closing={closing}
      forking={forking}
      onMouseDown={e => e.preventDefault()}
    >
      <TabContainer forking={forking} closing={closing}>
        {[
          'Overview',
          user && 'My Templates',
          'Client Templates',
          'Container Templates',
          'Import',
        ]
          .map((buttonName, index) => ({
            name: buttonName,
            tabIndex: index,
          }))
          .filter(({ name }) => Boolean(name))
          .map(({ name, tabIndex }) => (
            <Button
              key={name}
              onClick={() => setSelectedTab(tabIndex)}
              selected={selectedTab === tabIndex}
            >
              {name}
            </Button>
          ))}
      </TabContainer>

      <InnerContainer forking={forking} closing={closing}>
        <Tab visible={selectedTab === 0}>
          {user && <MyTemplates />}
          <Title>Popular Templates</Title>
          <Templates>
            {popular.map(type =>
              type.templates.map(template => (
                <Template
                  key={template.name}
                  template={template}
                  selectTemplate={selectTemplate}
                  small={false}
                />
              ))
            )}
          </Templates>
        </Tab>
        {user && (
          <Tab visible={selectedTab === 1}>
            <MyTemplatesTab selectTemplate={selectTemplate} />
          </Tab>
        )}
        <Tab visible={selectedTab === 2}>
          <Title>Client Templates</Title>
          <Templates>
            {client.map(template => (
              <Template
                key={template.name}
                template={template}
                selectTemplate={selectTemplate}
                small={false}
              />
            ))}
          </Templates>
          {/* TODO: Find a fix for css props
            // @ts-ignore */}
          <Title
            css={`
              margin-top: 1rem;
            `}
          >
            Presets
          </Title>
          <Templates>
            {presets.map(template => (
              <Template
                key={template.name}
                // @ts-ignore
                template={template}
                selectTemplate={selectTemplate}
                small={false}
              />
            ))}
          </Templates>
        </Tab>
        <Tab visible={selectedTab === 3}>
          <Title>Container Templates</Title>
          <Templates>
            {container.map(template => (
              <Template
                key={template.name}
                template={template}
                selectTemplate={selectTemplate}
                small={false}
              />
            ))}
          </Templates>
        </Tab>
        <Tab visible={selectedTab === 4}>
          <ImportTab />
        </Tab>
      </InnerContainer>
    </Container>
  );
});
