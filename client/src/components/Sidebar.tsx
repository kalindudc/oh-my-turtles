import React from 'react';
import { Box, List, ListItemButton, ListItemText } from '@mui/material';
import ExpandableListItem from './ExpandableListItem';

const Sidebar: React.FC = () => {

  return (
    <Box width='100%' >
      <List sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
      }}>
        <ExpandableListItem title="Item 1">
          <ExpandableListItem title="Subitem 1-1" notificationCount={10}>
            <ListItemButton>
              <ListItemText primary="Subitem 1-1 Content" onClick={() => {console.log("clicked 1-1")}} primaryTypographyProps={{ sx: { fontSize: '0.875rem' } }}/>
            </ListItemButton>
          </ExpandableListItem>
          <ExpandableListItem title="Subitem 1-2" notificationCount={1000}>
            <ListItemButton>
              <ListItemText primary="Subitem 1-2 Content" onClick={() => {console.log("clicked 1-2")}} primaryTypographyProps={{ sx: { fontSize: '0.875rem' } }} />
            </ListItemButton>
          </ExpandableListItem>
        </ExpandableListItem>
        <ExpandableListItem title="Item 2" notificationCount={999}>
          <ListItemButton>
            <ListItemText primary="Item 2 Content" onClick={() => {console.log("clicked 2")}} primaryTypographyProps={{ sx: { fontSize: '0.875rem' } }} />
          </ListItemButton>
        </ExpandableListItem>
      </List>
    </Box>
  );
};

export default Sidebar;
