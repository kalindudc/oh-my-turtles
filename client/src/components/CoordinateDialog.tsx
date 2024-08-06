import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, MenuItem, Box } from '@mui/material';
import { FacingDirection } from '../enums/DirectionEnum';
import { useData } from '../context/DataContext';

interface CoordinateDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (x: number, y: number, z: number, direction: FacingDirection, worldId: string) => void;
}

const CoordinateDialog: React.FC<CoordinateDialogProps> = ({ open, onClose, onSubmit }) => {
  const [x, setX] = useState<number | string>(0);
  const [y, setY] = useState<number | string>(0);
  const [z, setZ] = useState<number | string>(0);
  const [direction, setDirection] = useState<FacingDirection>(FacingDirection.north);
  const [worldId, setWorldID] = useState<string>('');
  const [customWorldID, setCustomWorldID] = useState('');

  const { worlds } = useData();
  const worldIDs = worlds.map((world) => world.id);

  const handleSubmit = () => {
    let finalWorldID = worldId;
    if (customWorldID) {
      finalWorldID = customWorldID;
    }
    onSubmit(Number(x), Number(y), Number(z), direction, finalWorldID);
    onClose();
  };

  const handleNumberInputChange = (setter: React.Dispatch<React.SetStateAction<number | string>>) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    const parsedValue = parseFloat(value);
    setter(isNaN(parsedValue) ? value : parsedValue);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Enter Coordinates, Direction and the World</DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: 2,
          margin: 2,
        }}
      >
        <TextField
          label="World ID"
          select
          fullWidth
          value={worldId}
          onChange={(e) => {setWorldID(e.target.value); console.log(e.target.value)}}
          sx={{ mt: 2 }}
          inputProps={{ step: 'any' }}
        >
          {worldIDs.map((id) => (
            <MenuItem key={id} value={id}>
              {id}
            </MenuItem>
          ))}
          <MenuItem value="custom_world_id">custom...</MenuItem>
        </TextField>
        {(worldIDs.length === 0 || (!worldIDs.includes(worldId) && worldId.length) || customWorldID) && (
          <TextField
            label="Enter World ID"
            value={customWorldID}
            onChange={(e) => setCustomWorldID(e.target.value)}
            fullWidth
            inputProps={{ step: 'any' }}
          />
        )}
        <Box
          component="div"
          display="flex"
          width="100%"
          gap={2}
        >
          <TextField
            label="X"
            type="number"
            fullWidth
            value={x}
            onChange={handleNumberInputChange(setX)}
            inputProps={{ step: 'any' }}
          />
          <TextField
            label="Y"
            type="number"
            fullWidth
            value={y}
            onChange={handleNumberInputChange(setY)}
            inputProps={{ step: 'any' }}
          />
          <TextField
            label="Z"
            type="number"
            fullWidth
            value={z}
            onChange={handleNumberInputChange(setZ)}
            inputProps={{ step: 'any' }}
          />
        </Box>
        <TextField
          label="Facing Direction"
          select
          fullWidth
          value={direction}
          onChange={(e) => setDirection(e.target.value as FacingDirection)}
        >
          {Object.keys(FacingDirection).map((key) => (
            <MenuItem key={key} value={FacingDirection[key as keyof typeof FacingDirection]}>
              {key}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} color="primary">Submit</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CoordinateDialog;
