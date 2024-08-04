import React from 'react';
import { Box, List, ListItemButton, ListItemText, ListItem, Tooltip } from '@mui/material';
import { Check, Clear, QuestionMark, Pets, SmartToy, WifiOff, Wifi } from '@mui/icons-material';

import ExpandableListItem from './ExpandableListItem';
import { useMachines, Machine, UninitiatedMachine } from '../context/MachineContext';
import { capitalize } from '../utils/functions';
import SendMessageIconButton from './SendMessageIconButton';
import { CommandsSent, createClientPayload } from '../context/WebSocketContext'
import { useUser } from '../context/AuthContext';
import MachineComponent from './MachineComponent';
import { useWebSocket } from '../context/WebSocketContext';

interface SidebarProps {
  onSelect: (machine: Machine) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelect }) => {
  const { machines, uninitiated } = useMachines();
  const { user } = useUser();

  const renderUninitiated = (uninitiated: Array<UninitiatedMachine> ) => {
    if (!uninitiated.length) {
      return;
    }

    return (
      <ExpandableListItem title='Uninitiated Machines' icon={<QuestionMark sx={{fontSize: "0.9rem"}} key="uninitiated-machine-list" />} >
        {
          uninitiated.map((machine: UninitiatedMachine) => (
            <ListItem key={"uninitiated-" + machine.id}>
              <ListItemText primary={capitalize(machine.type) + ": " + machine.id} primaryTypographyProps={{fontSize: '0.9rem'}} />
              <Box
                display='flex'
                gap={1}
              >
                <SendMessageIconButton
                  aria-label="accept"
                  color="primary"
                  sx={{
                    border: '0.01rem solid #ddd'
                  }}
                  payload={
                    createClientPayload({
                      command: CommandsSent.initiate_accept_machine,
                      machine_id: machine.id
                    }, user?.api_key)
                  }
                >
                  <Check fontSize="small" />
                </SendMessageIconButton>
                <SendMessageIconButton
                  aria-label="reject"
                  color="error"
                  sx={{
                    border: '0.01rem solid #ddd'
                  }}
                  payload={
                    createClientPayload({
                      command: CommandsSent.initiate_reject_machine,
                      machine_id: machine.id
                    }, user?.api_key)
                  }
                >
                  <Clear fontSize="small" />
                </SendMessageIconButton>
              </Box>
            </ListItem>
          ))
        }
      </ExpandableListItem>
    );
  };

  const renderMachines = (machines: Array<Machine> ) => {
    if (!machines.length) {
      return;
    }

    // group machines by type
    const machinesByType = machines.reduce((acc: {[key : string]: Array<Machine>}, machine: Machine) => {
      if (!acc[machine.type]) {
        acc[machine.type] = [];
      }
      acc[machine.type].push(machine);
      return acc;
    }, {});

    const getMachineIcon = (type: string) => {
      switch (type) {
        case 'turtle':
          return <Pets sx={{fontSize: "0.9rem"}} />;

        default:
          return <SmartToy sx={{fontSize: "0.9rem"}} />;
      }
    };

    return Object.keys(machinesByType).map((type: string) => {
      return (
        <ExpandableListItem title={capitalize(type)} icon={getMachineIcon(type)} key={"list-type-" + type} >
          {
            machinesByType[type].map((machine: Machine) => (
              <ListItemButton
                key={"machine-" + machine.name + "-" + machine.type}
                onClick={() => onSelect(machine)}
              >
                <ListItem
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <ListItemText primary={machine.name} primaryTypographyProps={{fontSize: '0.9rem'}} />
                  {machine.connected ?
                    <Tooltip title="online" placement="right">
                      <Wifi color='primary' />
                    </Tooltip>
                  :
                    <Tooltip title="offline" placement="right">
                      <WifiOff color='error' />
                    </Tooltip>
                  }
                </ListItem>
              </ListItemButton>
            ))
          }
        </ExpandableListItem>
      );
    });
  };

  return (
    <Box width='100%' >
      <List sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
      }}>

        {renderUninitiated(uninitiated)}
        {renderMachines(machines)}

      </List>
    </Box>
  );
};

export default Sidebar;
