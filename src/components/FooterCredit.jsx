const GITHUB_PAGE_URL = "https://github.com/farzanuddin";

export const FooterCredit = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-4 flex justify-center">
      <p className="text-xs font-base text-foreground/50">
        &copy; {currentYear}{" "}
        <a
          href={GITHUB_PAGE_URL}
          target="_blank"
          rel="noreferrer"
          className="text-foreground/50 underline underline-offset-2 hover:text-main transition-colors"
        >
          Farzan Uddin
        </a>
      </p>
    </footer>
  );
};
