import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { Arrow, useHover, useLayer } from "react-laag";
import { PlacementType } from "react-laag/dist/PlacementType";
import { useTheme } from "../..";
import style from "./Tooltip.module.css";

const Tooltip: React.FC<{
  children: React.ReactNode;
  placement: PlacementType;
  text: string | React.ReactNode;
}> = ({ children, text, placement = "top-center" }) => {
  const theme = useTheme();
  const [isOver, hoverProps] = useHover({ delayEnter: 100, delayLeave: 100 });

  const { triggerProps, layerProps, arrowProps, renderLayer } = useLayer({
    isOpen: isOver,
    placement,
    triggerOffset: 8,
  });

  const trigger = React.useMemo(() => {
    if (isReactText(children)) {
      return (
        <span
          className="tooltip-text-wrapper"
          {...triggerProps}
          {...hoverProps}
        >
          {children}
        </span>
      );
    } else {
      return React.cloneElement(children, {
        ...triggerProps,
        ...hoverProps,
      });
    }
  }, [children, triggerProps, hoverProps]);

  return (
    <>
      {trigger}
      {renderLayer(
        <AnimatePresence>
          {isOver && (
            <motion.div
              className={style.tooltip}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.1 }}
              data-cy={`tooltip-${text}`}
              {...layerProps}
              {...hoverProps}
            >
              {text}
              <Arrow
                {...arrowProps}
                backgroundColor={theme.background.level2}
                borderColor={theme.primary.plainBorder}
                borderWidth={1}
                size={6}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
};

const isReactText = (children: unknown) => {
  return ["string", "number"].includes(typeof children);
};

export default Tooltip;
