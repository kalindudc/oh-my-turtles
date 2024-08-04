import React, { useState } from 'react';
import { List, ListItemButton, ListItemText, Collapse, Box, Chip } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

interface ExpandableListItemProps {
  title: string;
  children?: React.ReactNode;
  notificationCount?: number;
  icon?: React.ReactNode;
  color?: string;
}

function notificationsLabel(count: number) {

  if (count > 99) {
    return '99+';
  }
  return `${count}`;
}

const ExpandableListItem: React.FC<ExpandableListItemProps> = ({ title, children, notificationCount, icon, color }) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(!open);
  };
  const fontColor = color ? color : '#4e4d3d';

  return (
    <Box width='100%' border='1px'>
      <ListItemButton
        onClick={handleClick}
        sx={{
          borderBottom: '1px solid #ccc',
          '&:last-child': {
            borderBottom: 'none',
          },
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >

        <Box
          display='flex'
          flexDirection='row'
          justifyContent='flex-start'
          alignItems='center'
          gap={1}
        >
          {notificationCount && notificationCount > 0 && (
            <Chip
              label={notificationsLabel(notificationCount)}
              color='error'
              size='small'
              sx={{
                fontSize: '0.65rem',
              }}
            />
          )}
          <Box
            display='flex'
            flexDirection='row'
            justifyContent='flex-start'
            alignItems='center'
            gap={0.5}
          >
            {icon}
            <ListItemText
              primary={title}
              primaryTypographyProps={{ sx: { fontSize: '0.9rem', color: fontColor } }} // Adjust font size here
            />
          </Box>
        </Box>
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={open}>
        <List
          component="div"
          disablePadding
          sx={{
            bgcolor: '#f5f1eb', // Subtle background tint
            borderLeft: '1px solid #ddd', // Optional: border for better separation
          }}
        >
          {children}
        </List>
      </Collapse>
    </Box>
  );
};

export default ExpandableListItem;
