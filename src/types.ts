export interface UserProfile {
  username: string;
  displayName: string;
  profilePicture: string;
  followerCount: number;
}

export interface RechargePackage {
  id: string;
  coins: number;
  price: number;
}
