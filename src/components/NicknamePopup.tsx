import { useEffect, useState, type FormEvent } from "react";
import "../styles/nicknamePopup.css";

type NicknamePopupProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  initialNickname?: string;
  submitLabel?: string;
  allowClose?: boolean;
  onClose?: () => void;
  onSubmit: (nickname: string) => Promise<void> | void;
};

const NicknamePopup = ({
  isOpen,
  title,
  description,
  initialNickname = "",
  submitLabel = "Lagre",
  allowClose = true,
  onClose,
  onSubmit,
}: NicknamePopupProps) => {
  const [nickname, setNickname] = useState(initialNickname);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setNickname(initialNickname);
    setError(null);
  }, [isOpen, initialNickname]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmed = nickname.trim();
    if (trimmed.length < 2) {
      setError("Kallenavn må være minst 2 tegn langt.");
      return;
    }

    if (trimmed.length > 24) {
      setError("Kallenavn kan ikke være lengre enn 24 tegn.");
      return;
    }

    try {
      setSaving(true);
      await onSubmit(trimmed);
    } catch {
      setError("Kunne ikke lagre kallenavn. Vennligst prøv igjen.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="nickname-overlay"
      onClick={() => {
        if (allowClose && onClose) onClose();
      }}
    >
      <div className="nickname-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {description && <p>{description}</p>}

        <form onSubmit={handleSubmit} className="nickname-form">
          <label htmlFor="nickname-input">Kallenavn</label>
          <input
            id="nickname-input"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={24}
            placeholder="Velg et kallenavn"
            autoFocus
            required
          />

          {error && <p className="post-form-error">{error}</p>}

          <div className="nickname-actions">
            {allowClose && onClose && (
              <button type="button" className="nickname-cancel" onClick={onClose}>
                Lukk
              </button>
            )}
            <button type="submit" disabled={saving}>
              {saving ? "Lagrer..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NicknamePopup;