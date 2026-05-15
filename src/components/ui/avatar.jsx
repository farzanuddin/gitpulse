import * as AvatarPrimitive from "@radix-ui/react-avatar";
import PropTypes from "prop-types";

import { cn } from "@/lib/utils";

function Avatar({ className, ...props }) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-base border-2 border-border",
        className
      )}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  );
}

AvatarImage.displayName = "AvatarImage";

Avatar.propTypes = {
  className: PropTypes.string,
};

AvatarImage.propTypes = {
  className: PropTypes.string,
};

export { Avatar, AvatarImage };
