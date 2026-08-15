# Stormkeeper V13

V13 fixes the V12 architecture mismatch and provides one coherent application entry point.

Key behavior:
- Character creation has NO subclass selectors.
- Primary/second class choices are mutually exclusive.
- Total level and class-level allocations are constrained.
- Subclasses unlock on the character sheet only at the appropriate class level.
- Subclass lists are filtered to the selected class.
- Armor and weapon choices are filtered by the selected classes and unlocked Tempest Domain proficiency.
- Level Up asks which class receives the level for multiclass characters.
- Dropping below a subclass unlock level clears an illegal subclass selection.
- Duplicate legacy app entry points were removed so GitHub Pages loads one application.
