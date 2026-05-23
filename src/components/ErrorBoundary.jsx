import { Component } from "react";
import PropTypes from "prop-types";
import { Button } from "./ui/button";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center px-4">
          <div className="rounded-base border-2 border-border bg-secondary-background p-6 text-center shadow-shadow">
            <h2 className="text-lg font-heading text-foreground">Something went wrong</h2>
            <p className="mt-2 text-sm font-base text-foreground/60">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <Button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Reload page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
