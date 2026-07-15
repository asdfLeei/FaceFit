export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type LocationMapSalon = MapCoordinate & {
  id: number;
  name: string;
  address: string;
};

export type LocationMapProps = {
  coordinate: MapCoordinate;
  salons?: LocationMapSalon[];
  onSelectSalon?: (salonId: number) => void;
};
