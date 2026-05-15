import { Badge } from "./ui/badge";
import { headerStatusShape } from "../utils/headerStatus";

export const Header = ({ status }) => {
  const showCache = status?.showCache;
  const showWarning = status?.showWarning;

  if (!showCache && !showWarning) {
    return null;
  }

  return (
    <header className="mx-auto flex w-full max-w-2xl items-center gap-2">
      <div className="flex min-h-[2.8rem] min-w-0 items-center gap-2" aria-live="polite">
        {showCache && (
          <Badge variant="default" className="animate-fade-in">
            Loaded from cache
          </Badge>
        )}
        {showWarning && (
          <Badge variant="default" className="animate-fade-in !bg-rose-400">
            {status.warningText}
          </Badge>
        )}
      </div>
    </header>
  );
};

Header.propTypes = {
  status: headerStatusShape.isRequired,
};
