import React, { useState } from 'react';
import { Box, List, ListItemButton, ListItemText, ListItem, Tooltip, IconButton } from '@mui/material';
import { Check, Clear, QuestionMark, Pets, SmartToy, WifiOff, Wifi } from '@mui/icons-material';

import ExpandableListItem from './ExpandableListItem';
import { useMachines, Machine, UninitiatedMachine } from '../context/MachineContext';
import { capitalize } from '../utils/functions';
import SendMessageIconButton from './SendMessageIconButton';
import { CommandsSent, createClientPayload, useWebSocket } from '../context/WebSocketContext'
import { useUser } from '../context/AuthContext';
import CoordinateDialog from './CoordinateDialog';
import { Direction } from '../enums/DirectionEnum';
import { send } from 'process';


interface SidebarProps {
  onSelect: (machine: Machine) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelect }) => {
  const { machines, uninitiated } = useMachines();
  const { user } = useUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<UninitiatedMachine | null>(null);
  const { sendMessage } = useWebSocket();

  const handleOpenDialog = (machine: UninitiatedMachine) => {
    console.log("opening dialog to request data")
    setSelectedMachine(machine);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMachine(null);
  };

  const handleDialogSubmit = (x: number, y: number, z: number, direction: Direction) => {
    if (selectedMachine) {
      const payload = createClientPayload({
        command: CommandsSent.initiate_accept_machine,
        machine_id: selectedMachine.id,
        data: {
          cords: {
            x: x,
            y: y,
            z: z
          },
          facing: direction,
        }
      }, user?.api_key);
      sendMessage(JSON.stringify(payload));
    }
  };

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
                <IconButton
                  aria-label="accept"
                  color="primary"
                  sx={{
                    border: '0.01rem solid #ddd'
                  }}
                  onClick={() => handleOpenDialog(machine)}
                >
                  <Check fontSize="small" />
                </IconButton>
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
    const machinesByType : {[key: string]: Array<Machine>} = {};
    machines.forEach((machine: Machine) => {
      if (machinesByType[machine.type]) {
        machinesByType[machine.type].push(machine);
      } else {
        machinesByType[machine.type] = [machine];
      }
    });

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
      <CoordinateDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleDialogSubmit}
      />
    </Box>
  );
};

export default Sidebar;
