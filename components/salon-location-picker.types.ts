export type SalonLocationPickerProps = {
  latitude: number;
  longitude: number;
  onChange: (coordinate: { latitude: number; longitude: number }) => void;
};
