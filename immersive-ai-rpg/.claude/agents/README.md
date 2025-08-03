# Claude Code Agents for Immersive AI RPG

This directory contains specialized Claude Code agents designed to assist with different aspects of game development. Each agent has specific expertise and focuses on particular domains.

## Agent Categories

### Balance Agents
- **adversarial-gm.md**: Prevents player favoritism bias and ensures challenging gameplay
- **balance-framework.md**: Systematic challenge scaling and difficulty management

### Content Agents
- **world-builder.md**: World generation and environmental design
- **narrative-generator.md**: Dynamic storytelling and plot development
- **lore-master.md**: Character backstories and world history
- **quest-designer.md**: Mission and objective creation

### Presentation Agents
- **scene-painter.md**: Visual prompt generation for scene imagery
- **voice-director.md**: Audio script creation and voice synthesis
- **mood-stylist.md**: Emotional theming and CSS styling
- **art-curator.md**: Visual consistency management

### Simulation Agents
- **memory-agent.md**: Player history tracking and continuity
- **diplomacy-engine.md**: Faction relationship simulation
- **event-weaver.md**: World reaction generation
- **economy-simulator.md**: Market and resource management

### Technical Agents
- **react-game-dev.md**: React optimization and UI development
- **combat-systems.md**: Battle mechanics and balance
- **game-tester.md**: QA and user experience testing

## Usage

To use an agent, invoke it with:
```
@agent <agent-name> <your-request>
```

Example:
```
@agent world-builder Create a mystical forest with ancient ruins
```