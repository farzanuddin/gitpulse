import { Badge } from "./ui/badge";
import { headerStatusShape } from "../utils/headerStatus";

export const Header = ({ status }) => {
  const hasStatus = Boolean(status?.showCache || status?.showWarning);

  return (
    <header className="mx-auto flex w-full max-w-2xl items-center gap-2">
      <div
        className="flex min-h-[2.8rem] min-w-0 items-center gap-2"
        aria-live="polite"
        style={{ visibility: hasStatus ? "visible" : "hidden" }}
      >
        {status?.showCache && (
          <Badge variant="default" className="animate-fade-in">
            Loaded from cache
          </Badge>
        )}
        {status?.showWarning && (
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
