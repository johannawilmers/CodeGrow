import React from "react";
import "../styles/surveyPopup.css";
import { logUserClick } from "../utils/clickLogger";

interface Props {
  onClose: () => void;
  userId: string | null;
}

const SurveyPopup: React.FC<Props> = ({ onClose, userId }) => {
  return (
    <div className="survey-overlay">
      <div className="survey-modal">
        <h2>Viktig melding før du starter</h2>
        <p>
          For å være med i trekningen av gavekort er det obligatorisk å delta i
          spørreundersøkelsene. For å hjelpe med å evaluere CodeGrow, vil vi
          gjerne at du tar en kort undersøkelse før du begynner å bruke
          plattformen. Det tar bare ett minutt, og dine tilbakemeldinger er
          uvurderlige for oss!
        </p>

        <p>
          <strong>User ID:</strong> {userId || "(ingen)"} (Kopier denne til å identifisere deg i undersøkelsen)
        </p>

        <p>
          <button
            onClick={() => {
              logUserClick(userId, { type: "survey_link_click", target: "survey_form" });
              window.open("https://forms.office.com/Pages/ResponsePage.aspx?id=cgahCS-CZ0SluluzdZZ8BZ_gZpSo7_dPng7lyyEl-QpUQzBGSFdXREk3RlhaQTdIWEFJQUM1QzlZOC4u", "_blank");
            }}
          >
            Gå til undersøkelsen
          </button>
        </p>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            logUserClick(userId, { type: "survey_close", target: "survey_popup" });
            onClose();
          }}
          style={{ cursor: "pointer", textDecoration: "underline", color: "var(--primary-main)" }}
        >
          Jeg har fullført undersøkelsen, og vil starte å kode!
        </a>
      </div>
    </div>
  );
};

export default SurveyPopup;
