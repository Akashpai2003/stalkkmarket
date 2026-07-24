import { Chatbot } from "./Chatbot";

interface ResearchCompactProps {
  onExpand?: (stockSymbol?: string, initialQuery?: string) => void;
  recentQuery?: string;
}

export function ResearchCompact({ onExpand: _onExpand }: ResearchCompactProps) {
  return (
    <div className="flex-1 flex flex-col border border-border bg-card rounded-xl overflow-hidden shadow-none h-full min-h-0">
      <div className="flex-1 min-h-0 h-full overflow-hidden">
        <Chatbot selectedSymbol={null} onSelectSymbol={() => {}} />
      </div>
    </div>
  );
}
