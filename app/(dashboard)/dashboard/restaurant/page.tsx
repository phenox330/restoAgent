import { RestaurantForm } from "@/components/restaurant/restaurant-form";
import { getRestaurant } from "@/lib/restaurant/actions";

export default async function RestaurantPage() {
  const result = await getRestaurant();
  const restaurant = result.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mon Restaurant</h1>
        <p className="text-muted-foreground">
          {restaurant
            ? "Modifiez les informations de votre restaurant"
            : "Configurez votre restaurant pour commencer à recevoir des réservations"}
        </p>
      </div>

      <RestaurantForm restaurant={restaurant || undefined} />
    </div>
  );
}
