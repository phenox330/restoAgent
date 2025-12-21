import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez les paramètres de votre compte
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paramètres du compte</CardTitle>
          <CardDescription>
            Configurez votre compte et vos préférences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Paramètres en cours de développement...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
