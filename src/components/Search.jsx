import { Loader2, Search as SearchIcon } from "lucide-react";
import PropTypes from "prop-types";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Display } from "./Display";
import { FooterCredit } from "./FooterCredit";
import { useGithubUserSearch } from "../hooks/useGithubUserSearch";

export const Search = ({ onStatusChange }) => {
  const {
    activeSuggestionIndex,
    data,
    error,
    handleChange,
    handleInputBlur,
    handleInputFocus,
    handleInputKeyDown,
    handleSearchBarClick,
    handleSuggestionSelect,
    handleSubmit,
    isSuggesting,
    loading,
    search,
    searchInputRef,
    shake: shakeAnimation,
    showSuggestions,
    suggestions,
  } = useGithubUserSearch({ onStatusChange });

  return (
    <main className="flex items-center">
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        <form
          autoComplete="off"
          onSubmit={handleSubmit}
          onClick={handleSearchBarClick}
          className="relative rounded-base border-2 border-border bg-secondary-background shadow-shadow"
        >
          <div className="flex items-center gap-2 px-3 py-2">
            <SearchIcon className="size-5 shrink-0 text-foreground/60" />
            <Input
              ref={searchInputRef}
              id="userSearch"
              type="text"
              value={search}
              placeholder="Search GitHub username..."
              onChange={handleChange}
              onKeyDown={handleInputKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              aria-label="Search GitHub username"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              aria-controls="user-search-suggestions"
              className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="flex items-center gap-2">
              <span className="sr-only" aria-live="polite">
                {loading ? "Searching user..." : error}
              </span>
              {loading && <Loader2 className="size-4 animate-spin text-foreground/60" />}
              <Button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className={shakeAnimation ? "animate-[shake_0.5s_ease]" : ""}
              >
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
          {(showSuggestions || isSuggesting) && (
            <div
              id="user-search-suggestions"
              role="listbox"
              className="absolute left-[-2px] right-[-2px] top-full z-10 mt-1 rounded-base border-2 border-border bg-secondary-background shadow-shadow"
            >
              {isSuggesting && !suggestions.length && (
                <p className="px-4 py-3 text-sm text-foreground/60">Searching users...</p>
              )}
              {!isSuggesting && !suggestions.length && (
                <p className="px-4 py-3 text-sm text-foreground/60">No username suggestions yet</p>
              )}
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  role="option"
                  aria-selected={index === activeSuggestionIndex}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-base transition-colors hover:bg-main hover:text-main-foreground ${
                    index === activeSuggestionIndex
                      ? "bg-main text-main-foreground"
                      : "text-foreground"
                  }`}
                >
                  <img
                    src={suggestion.avatar_url}
                    alt=""
                    aria-hidden="true"
                    className="size-8 rounded-base border-2 border-border"
                  />
                  <span>{suggestion.login}</span>
                </button>
              ))}
            </div>
          )}
        </form>
        {data && <Display data={data} />}
        <FooterCredit />
      </div>
    </main>
  );
};

Search.propTypes = {
  onStatusChange: PropTypes.func,
};
