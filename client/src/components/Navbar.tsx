import * as React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Logout } from '@mui/icons-material';



import useAuth from '../hooks/useAuth';
import { useUser } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { logout } = useAuth();
  const { user } = useUser();

  const handleLogout = async () => {
    await logout();
  };

  const capitalize = (str : string | undefined) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return (
    <Box sx={{ flexGrow: 1 }} width='100%'>
      <AppBar position="static">
        <Toolbar
          sx={{
            backgroundColor: '#1e222a',
          }}
        >
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {capitalize(user?.username)}
          </Typography>
          
          {user && (
            <div>
              <Button variant="contained" size='small' color="error" startIcon={<Logout />} onClick={handleLogout}>
                Logout
              </Button>
            </div>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Navbar;
