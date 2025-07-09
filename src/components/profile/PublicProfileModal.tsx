import PublicProfile from './PublicProfile';

type PublicProfileModalProps = {
  onClose: () => void;
  profile?: any;
  userId?: string;
  username?: string;
};

export default function PublicProfileModal({ onClose, profile, userId, username }: PublicProfileModalProps) {
  const targetUsername = username || profile?.username;

  if (!targetUsername) {
    return null;
  }

  return (
    <PublicProfile 
      username={targetUsername} 
      onClose={onClose}
    />
  );
}
