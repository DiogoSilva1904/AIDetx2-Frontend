import { useState } from "react";
import {
    useFloating,
    offset,
    flip,
    shift,
    useHover,
    useFocus,
    useDismiss,
    useRole,
    useInteractions,
    autoUpdate,
} from "@floating-ui/react";
import "./InfoTooltip.css";

interface Props {
  text: string;
}

export default function InfoTooltip({ text }: Props) {
  const [open, setOpen] = useState(false);

    const { refs, floatingStyles, context } = useFloating({
        open,
        onOpenChange: setOpen,
        placement: "right",
        middleware: [offset(10), flip(), shift({ padding: 8 })],
        whileElementsMounted: autoUpdate,
    });

    const hover = useHover(context);
    const focus = useFocus(context);
    const dismiss = useDismiss(context);
    const role = useRole(context);

    const { getReferenceProps, getFloatingProps } = useInteractions([
        hover,
        focus,
        dismiss,
        role,
    ]);
  return (
    <>
    <span
        ref={refs.setReference}
        {...getReferenceProps()}
        className="info-tooltip-icon"
    >
        ?
    </span>

    {open && (
        <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="info-tooltip-popup"
        >
            {text}
        </div>
    )}
    </>
  );
}