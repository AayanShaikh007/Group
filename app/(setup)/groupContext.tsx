import React, { createContext, useContext, useState, ReactNode } from 'react';

type GroupContextType = {
  groupId: string;
  setGroupId: (val: string) => void;
  username: string;
  setUsername: (val: string) => void;
};

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const GroupProvider = ({ children }: { children: ReactNode }) => {
  const [groupId, setGroupId] = useState('');
  const [username, setUsername] = React.useState('');

  return (
    <GroupContext.Provider value={{ groupId, setGroupId, username, setUsername }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) throw new Error('useGroup must be used within GroupProvider');
  return context;
};
