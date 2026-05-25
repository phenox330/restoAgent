import { RestaurantForm } from "@/components/restaurant/restaurant-form";
import { BotToggle } from "@/components/restaurant/bot-toggle";
import { PhoneForwardingWizard } from "@/components/restaurant/phone-forwarding-wizard";
import { getRestaurant } from "@/lib/restaurant/actions";
import { getVapiPhoneNumber } from "@/lib/vapi/phone-number";

export default async function RestaurantPage() {
  const result = await getRestaurant();
  const restaurant = result.data;

  const vapiNumber = restaurant?.vapi_phone_number_id
    ? await getVapiPhoneNumber(restaurant.vapi_phone_number_id)
    : null;

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

      {restaurant && (
        <>
          <BotToggle
            enabled={restaurant.bot_enabled}
            hasVapiNumber={!!restaurant.vapi_phone_number_id}
          />
          <PhoneForwardingWizard vapiNumber={vapiNumber} />
        </>
      )}

      <RestaurantForm restaurant={restaurant || undefined} />
    </div>
  );
}
