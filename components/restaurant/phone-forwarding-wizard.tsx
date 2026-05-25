"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  PhoneForwarded,
  Smartphone,
  Phone,
  Server,
  HelpCircle,
  Copy,
  Check,
} from "lucide-react";

interface PhoneForwardingWizardProps {
  vapiNumber: string | null;
}

type LineType = "mobile" | "fixe" | "voip" | "unknown";

const LINE_OPTIONS: { id: LineType; label: string; hint: string; icon: typeof Phone }[] = [
  { id: "mobile", label: "Mobile", hint: "06 / 07", icon: Smartphone },
  { id: "fixe", label: "Fixe / box", hint: "01–05, 09", icon: Phone },
  { id: "voip", label: "Standard / VoIP", hint: "3CX, Aircall…", icon: Server },
  { id: "unknown", label: "Je ne sais pas", hint: "", icon: HelpCircle },
];

export function PhoneForwardingWizard({ vapiNumber }: PhoneForwardingWizardProps) {
  const [lineType, setLineType] = useState<LineType | null>(null);
  const [copied, setCopied] = useState(false);

  if (!vapiNumber) {
    return (
      <section className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-200/40 p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-lg">
            <PhoneForwarded className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Connecter votre numéro</h2>
            <p className="text-sm text-muted-foreground">
              Un numéro vocal va être attribué à votre restaurant. Contactez le
              support si cela tarde.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Renvoi sur non-réponse (~20s) ; '#' encodé en %23 pour le lien tel:
  const gsmCode = `**61*${vapiNumber}**20#`;
  const telLink = `tel:${`**61*${vapiNumber}**20%23`}`;

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(vapiNumber as string);
      setCopied(true);
      toast.success("Numéro copié");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  }

  return (
    <section className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-200/40 p-6 space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <PhoneForwarded className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Connecter votre numéro</h2>
          <p className="text-sm text-muted-foreground">
            Vous gardez votre numéro. Renvoyez vos appels manqués vers
            l&apos;assistant.
          </p>
        </div>
      </div>

      {/* Numéro vocal attribué */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl">
        <div>
          <p className="text-xs text-muted-foreground">Votre numéro vocal (à recevoir le renvoi)</p>
          <p className="text-lg font-semibold tracking-tight">{vapiNumber}</p>
        </div>
        <button
          type="button"
          onClick={copyNumber}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copié" : "Copier"}
        </button>
      </div>

      {/* Sélecteur de type de ligne */}
      <div>
        <p className="text-sm font-medium mb-3">Quel type de ligne est votre numéro principal ?</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {LINE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = lineType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLineType(opt.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                  active
                    ? "border-indigo-500 bg-indigo-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-indigo-600" : "text-gray-500"}`} />
                <span className="text-sm font-medium">{opt.label}</span>
                {opt.hint && <span className="text-xs text-muted-foreground">{opt.hint}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Instructions adaptées */}
      {lineType === "mobile" && (
        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3">
          <p className="text-sm text-indigo-900">
            Depuis votre mobile, activez le renvoi sur non-réponse (~3-4 sonneries) :
          </p>
          <a
            href={telLink}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <PhoneForwarded className="h-4 w-4" />
            Activer le renvoi
          </a>
          <p className="text-xs text-indigo-700">
            Ou composez manuellement : <span className="font-mono">{gsmCode}</span>
            <br />
            Vérifier : <span className="font-mono">*#61#</span> · Annuler :{" "}
            <span className="font-mono">##61#</span>
          </p>
        </div>
      )}

      {lineType === "fixe" && (
        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-2">
          <p className="text-sm text-indigo-900">
            Dans l&apos;espace client de votre opérateur (Orange, SFR, Free,
            Bouygues…) ou sur votre box :
          </p>
          <ol className="text-sm text-indigo-800 list-decimal list-inside space-y-1">
            <li>Rubrique « Renvoi d&apos;appel »</li>
            <li>Choisir « Si pas de réponse » (et / ou « Si occupé »)</li>
            <li>
              Renvoyer vers : <span className="font-mono font-medium">{vapiNumber}</span>
            </li>
          </ol>
        </div>
      )}

      {lineType === "voip" && (
        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-2">
          <p className="text-sm text-indigo-900">
            Dans l&apos;administration de votre standard téléphonique (3CX,
            Aircall, OVH Telecom…) :
          </p>
          <ol className="text-sm text-indigo-800 list-decimal list-inside space-y-1">
            <li>Créer une règle d&apos;appel sur non-réponse (~20 s)</li>
            <li>
              Destination du renvoi : <span className="font-mono font-medium">{vapiNumber}</span>
            </li>
          </ol>
        </div>
      )}

      {lineType === "unknown" && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
          <p className="text-sm text-amber-900">
            Pas de souci. Deux options :
          </p>
          <ul className="text-sm text-amber-800 list-disc list-inside space-y-1">
            <li>
              Regardez votre facture : un numéro en 06/07 = mobile, en 01-09 =
              fixe/box.
            </li>
            <li>
              Ou contactez le support : on peut aussi <span className="font-medium">porter votre
              numéro</span> chez nous (aucune config de votre côté ensuite).
            </li>
          </ul>
        </div>
      )}

      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <p className="text-sm text-blue-800">
          Votre téléphone sonne toujours en premier. L&apos;assistant ne prend
          que les appels que vous ne décrochez pas. Pour tester : appelez votre
          numéro depuis un autre téléphone et ne décrochez pas.
        </p>
      </div>
    </section>
  );
}
