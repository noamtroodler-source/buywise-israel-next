import { ProfileSearchAlerts } from './ProfileSearchAlerts';
import { ProfilePriceAlerts } from './ProfilePriceAlerts';

export function ProfileTabAlerts() {
  return (
    <div className="space-y-6">
      {/* Search Alerts */}
      <ProfileSearchAlerts />

      {/* Price Drop Alerts */}
      <ProfilePriceAlerts />
    </div>
  );
}
