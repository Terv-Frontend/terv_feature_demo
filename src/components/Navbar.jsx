import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import AdbIcon from '@mui/icons-material/Adb';
import logo from "../assets/terv-logo.png";
import userIcon from "../assets/user.svg";
import { Link } from 'react-router-dom';

const pages = [{title : "Dashboard" , link : "/"},{title : 'Prepare' , link : "/assessment"}, {title : 'Practice' , link : "/assessment"}, {title : 'Assessments' , link : "/assessment"}];
const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

function Navbar() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <div className='w-full mb-2 h-[90px] bg-[#564ab1]'>
      <AppBar position="static">
      <Container maxWidth="xl" className='bg-[#221d48] text-[16px] font-[500]'>
        <Toolbar disableGutters>
        <div className='w-1/3 flex justify-start pb-2'>
          <div className='w-[30%] bg-transparent'>
            <img src={logo} alt="terv-logo" className="w-full py-2 hover:cursor-pointer" onClick={() => window.location.href = "/"}/>
          </div>
        </div>
        <div className='flex justify-around w-1/2 p-2'>
        {
          pages.map((page) => (
            <Link
              key={page.title}
              to={page.link}
              className='text-white p-2 m-2 hover:text-[#784df5]  hover:border-b-4 hover:border-[#784df5]'
            >
              {page.title}
            </Link>
          ))
        }
        </div>
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 , ml:10 }}>
                <Avatar alt="Remy Sharp" src={userIcon} />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseUserMenu}>
                  <Typography sx={{ textAlign: 'center' }}>{setting}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
     </AppBar>
    </div>
  );
}
export default Navbar;
