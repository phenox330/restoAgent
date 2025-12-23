import { getCallsWithRestaurantId } from "@/lib/calls/actions";
import { LiveFeed } from "@/components/calls/live-feed";
import { Phone } from "lucide-react";

export default async function CallsPage() {
  const { calls, restaurantId } = await getCallsWithRestaurantId();

  if (!restaurantId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Appels</h1>
          <p className="text-muted-foreground">
            Historique des appels de votre agent vocal
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Phone className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Configurez d&apos;abord votre restaurant pour voir les appels
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Appels</h1>
        <p className="text-muted-foreground">
          Historique des appels de votre agent vocal - Mise à jour en temps réel
        </p>
      </div>

      <LiveFeed restaurantId={restaurantId} initialCalls={calls} />
    </div>
  );
}
