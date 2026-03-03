import React from "react";
import "../styles/surveyPopup.css";

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
          <a
            href="https://forms.office.com/Pages/ResponsePage.aspx?id=cgahCS-CZ0SluluzdZZ8BZ_gZpSo7_dPng7lyyEl-QpUQzBGSFdXREk3RlhaQTdIWEFJQUM1QzlZOC4u"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gå til undersøkelsen
          </a>
        </p>
        <button onClick={onClose}>Jeg har fullført undersøkelsen, og vil starte å kode!</button>
      </div>
    </div>
  );
};

export default SurveyPopup;
