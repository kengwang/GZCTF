import React, { useState, useEffect } from 'react';
import { Table, TextInput, Button, Group, Container, ActionIcon } from '@mantine/core';
import { Icon } from '@mdi/react';
import { mdiPlus, mdiTrashCan } from '@mdi/js';
import { useTranslation } from 'react-i18next';

const GenerateRandomCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 16; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

interface OrganizationTableProps {
  organization: Record<string, string | null>;
  onOrganizationChange: (updatedOrganization: Record<string, string | null>) => void;
}

const OrganizationTable: React.FC<OrganizationTableProps> = ({
  organization: initialOrganization,
  onOrganizationChange
}) => {
  const { t } = useTranslation()
  const [organization, setOrganization] = useState<Record<string, string | null>>(initialOrganization);
  const [newKey, setNewKey] = useState<string>('');

  useEffect(() => {
    setOrganization(initialOrganization);
  }, [initialOrganization]);

  const handleValueChange = (key: string, value: string) => {
    const updatedOrganization = {
      ...organization,
      [key]: value,
    };
    setOrganization(updatedOrganization);
    onOrganizationChange(updatedOrganization);
  };

  const handleAddItem = () => {
    if (newKey && !(newKey in organization)) {
      const updatedOrganization = {
        ...organization,
        [newKey]: GenerateRandomCode(),
      };
      setOrganization(updatedOrganization);
      onOrganizationChange(updatedOrganization);
      setNewKey('');
    } else {
      alert('Key is either empty or already exists.');
    }
  };

  const handleDeleteItem = (key: string) => {
    const { [key]: _, ...remaining } = organization;
    setOrganization(remaining);
    onOrganizationChange(remaining);
  };

  return (
    <Container>
      <Table highlightOnHover>
        <thead>
          <tr>
            <th>{t('game.organization')}</th>
            <th>{ t('admin.content.games.info.invite_code.label') }</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(organization).map(([key, value]) => (
            <tr key={key}>
              <td>{key}</td>
              <td>
                <TextInput
                  value={value ?? ''}
                  variant="filled"
                  size="xs"
                  onChange={(e) => handleValueChange(key, e.currentTarget.value)}
                />
              </td>
              <td>
                <ActionIcon variant="transparent" aria-label={t('admin.game.edit.organizations.delete')} color='red' onClick={() => handleDeleteItem(key)}>
                  <Icon path={mdiTrashCan} />
                </ActionIcon>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Group mt="md">
        <TextInput
          placeholder="Key"
          value={newKey}
          onChange={(e) => setNewKey(e.currentTarget.value)}
        />
        <ActionIcon variant="filled" aria-label={t('admin.game.edit.organizations.add')} onClick={handleAddItem}>
          <Icon path={mdiPlus} />
        </ActionIcon>

      </Group>
    </Container>
  );
};

export default OrganizationTable;
