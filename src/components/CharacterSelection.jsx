import React, { useState } from "react";
import "./CharacterSelection.css";

const characters = [
  { name: "Weslie", displayName: "Weslie" },
  { name: "Wolnie", displayName: "Wolnie" },
  { name: "Wolffy", displayName: "Wolffy" },
  { name: "Wilie", displayName: "Wilie" },
  { name: "Tibbie", displayName: "Tibbie" },
  { name: "Sparky", displayName: "Sparky" },
  { name: "Paddi", displayName: "Paddi" },
  { name: "Jonie", displayName: "Jonie" },
];

const CharacterSelection = ({ onCharacterSelect, onBack }) => {
  const [selectedCharacter, setSelectedCharacter] = useState("Weslie");

  const handleCharacterClick = (character) => {
    setSelectedCharacter(character.name);
  };

  const handleConfirm = () => {
    onCharacterSelect(selectedCharacter);
  };

  return (
    <div className="character-selection">
      <h2>Choose Your Character</h2>
      <div className="character-grid">
        {characters.map((character) => (
          <div
            key={character.name}
            className={`character-option ${
              selectedCharacter === character.name ? "selected" : ""
            }`}
            onClick={() => handleCharacterClick(character)}
          >
            <img
              src={`/main/${character.name}.webp`}
              alt={character.displayName}
              className="character-image"
            />
            <span className="character-name">{character.displayName}</span>
          </div>
        ))}
      </div>
      <div className="character-selection-buttons">
        <button className="back-button" onClick={onBack}>
          Back
        </button>
        <button className="confirm-button" onClick={handleConfirm}>
          Start Game
        </button>
      </div>
    </div>
  );
};

export default CharacterSelection;
