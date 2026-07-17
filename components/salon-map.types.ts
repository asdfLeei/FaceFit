export type SalonMapItem = {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  profileImageUrl?: string | null;
};

export type SalonMapProps = {
  salons: SalonMapItem[];
  onSelectSalon?: (salonId: number) => void;
};
