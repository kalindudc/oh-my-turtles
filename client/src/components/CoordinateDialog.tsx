import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, MenuItem } from '@mui/material';
import { Direction } from '../enums/DirectionEnum';

interface CoordinateDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (x: number, y: number, z: number, direction: Direction) => void;
}

const CoordinateDialog: React.FC<CoordinateDialogProps> = ({ open, onClose, onSubmit }) => {
  const [x, setX] = useState<number | string>(0);
  const [y, setY] = useState<number | string>(0);
  const [z, setZ] = useState<number | string>(0);
  const [direction, setDirection] = useState<Direction>(Direction.north);

  const handleSubmit = () => {
    onSubmit(Number(x), Number(y), Number(z), direction);
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
      <DialogTitle>Enter Coordinates and Direction</DialogTitle>
      <DialogContent>
        <TextField
          label="X"
          type="number"
          fullWidth
          value={x}
          onChange={handleNumberInputChange(setX)}
          sx={{ mb: 2 }}
          inputProps={{ step: 'any' }}
        />
        <TextField
          label="Y"
          type="number"
          fullWidth
          value={y}
          onChange={handleNumberInputChange(setY)}
          sx={{ mb: 2 }}
          inputProps={{ step: 'any' }}
        />
        <TextField
          label="Z"
          type="number"
          fullWidth
          value={z}
          onChange={handleNumberInputChange(setZ)}
          sx={{ mb: 2 }}
          inputProps={{ step: 'any' }}
        />
        <TextField
          label="Direction"
          select
          fullWidth
          value={direction}
          onChange={(e) => setDirection(e.target.value as Direction)}
          sx={{ mb: 2 }}
        >
          {Object.keys(Direction).map((key) => (
            <MenuItem key={key} value={Direction[key as keyof typeof Direction]}>
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
