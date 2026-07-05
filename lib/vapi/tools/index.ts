// Point d'entrée des tools Vapi : routeur handleToolCall + ré-export des handlers.
// Les handlers sont regroupés par domaine dans les modules voisins.
import { handleGetRestaurantInfo, handleGetCurrentDate } from "./info";
import { handleCheckAvailability, handleCreateReservation } from "./booking";
import {
  handleCancelReservation,
  handleFindAndCancelReservation,
  handleFindReservationForCancellation,
  handleFindAndUpdateReservation,
} from "./cancellation";
import {
  handleAddToWaitlist,
  handleTransfer,
  handleCreateTechnicalErrorRequest,
} from "./misc";
import type {
  GetRestaurantInfoArgs,
  CheckAvailabilityArgs,
  CreateReservationArgs,
  CancelReservationArgs,
  FindAndCancelReservationArgs,
  FindReservationForCancellationArgs,
  FindAndUpdateReservationArgs,
  AddToWaitlistArgs,
  TransferCallArgs,
  CreateTechnicalErrorRequestArgs,
} from "./types";

export * from "./types";
export {
  handleGetRestaurantInfo,
  handleGetCurrentDate,
  handleCheckAvailability,
  handleCreateReservation,
  handleCancelReservation,
  handleFindAndCancelReservation,
  handleFindReservationForCancellation,
  handleFindAndUpdateReservation,
  handleAddToWaitlist,
  handleTransfer,
  handleCreateTechnicalErrorRequest,
};

export async function handleToolCall(toolName: string, args: unknown) {
  switch (toolName) {
    case "get_restaurant_info":
      return handleGetRestaurantInfo(args as GetRestaurantInfoArgs);
    case "get_current_date":
      return handleGetCurrentDate();
    case "check_availability":
      return handleCheckAvailability(args as CheckAvailabilityArgs);
    case "create_reservation":
      return handleCreateReservation(args as CreateReservationArgs);
    case "cancel_reservation":
      return handleCancelReservation(args as CancelReservationArgs);
    case "find_and_cancel_reservation":
      return handleFindAndCancelReservation(args as FindAndCancelReservationArgs);
    case "find_reservation_for_cancellation":
      return handleFindReservationForCancellation(
        args as FindReservationForCancellationArgs
      );
    case "find_and_update_reservation":
      return handleFindAndUpdateReservation(args as FindAndUpdateReservationArgs);
    case "add_to_waitlist":
      return handleAddToWaitlist(args as AddToWaitlistArgs);
    case "transfer_call":
      return handleTransfer(args as TransferCallArgs);
    case "create_technical_error_request":
      return handleCreateTechnicalErrorRequest(
        args as CreateTechnicalErrorRequestArgs
      );
    default:
      return {
        success: false,
        message: `Fonction inconnue: ${toolName}`,
      };
  }
}
