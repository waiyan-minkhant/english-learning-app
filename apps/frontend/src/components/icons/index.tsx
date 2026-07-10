import type { IconType } from "react-icons";
import {
  FiCamera,
  FiCameraOff,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiLock,
  FiMessageSquare,
  FiMic,
  FiMicOff,
  FiPhoneOff,
  FiSettings,
  FiUsers,
  FiX
} from "react-icons/fi";
import { cn } from "@/utils/cn";

type IconProps = {
  size?: number;
  className?: string;
};

function createIcon(Icon: IconType) {
  return function WrappedIcon({ size = 16, className }: IconProps) {
    return <Icon size={size} className={cn("text-icon", className)} />;
  };
}

export const CheckIcon = createIcon(FiCheck);
export const CloseIcon = createIcon(FiX);
export const MicrophoneIcon = createIcon(FiMic);
export const MicrophoneOffIcon = createIcon(FiMicOff);
export const CameraIcon = createIcon(FiCamera);
export const CameraOffIcon = createIcon(FiCameraOff);
export const PhoneOffIcon = createIcon(FiPhoneOff);
export const ChevronLeftIcon = createIcon(FiChevronLeft);
export const ChevronRightIcon = createIcon(FiChevronRight);
export const LockIcon = createIcon(FiLock);
export const MessageIcon = createIcon(FiMessageSquare);
export const SettingsIcon = createIcon(FiSettings);
export const UsersIcon = createIcon(FiUsers);
