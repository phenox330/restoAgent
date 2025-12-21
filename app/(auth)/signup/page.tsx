import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">RestoAgent</h1>
        <p className="text-muted-foreground">
          Gestion de réservations par agent vocal IA
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
