import React, { useMemo } from 'react';

interface AdminNavProps {
  specialtyGroups: any[];
  searchTerm: string;
}

const AdminNav: React.FC<AdminNavProps> = ({ specialtyGroups, searchTerm }) => {
  const filteredGroups = useMemo(() => 
    specialtyGroups.map(group => ({
      ...group,
      providers: group.providers.filter(provider => 
        provider.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(group => group.providers.length > 0),
    [specialtyGroups, searchTerm]
  );

  return (
    // JSX for AdminNav component
  );
};

export default AdminNav;
