import type { IconType } from "react-icons";
import {
  FiCamera,
  FiCameraOff,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiHome,
  FiLock,
  FiMessageSquare,
  FiMic,
  FiMicOff,
  FiMousePointer,
  FiPhoneOff,
  FiSettings,
  FiUsers,
  FiVolume2,
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
export const HomeIcon = createIcon(FiHome);
export const SpeakerIcon = createIcon(FiVolume2);
export const MicrophoneIcon = createIcon(FiMic);
export const MicrophoneOffIcon = createIcon(FiMicOff);
export const MousePointerIcon = createIcon(FiMousePointer);
export const CameraIcon = createIcon(FiCamera);
export const CameraOffIcon = createIcon(FiCameraOff);
export const PhoneOffIcon = createIcon(FiPhoneOff);
export const ChevronLeftIcon = createIcon(FiChevronLeft);
export const ChevronRightIcon = createIcon(FiChevronRight);
export const LockIcon = createIcon(FiLock);
export const MessageIcon = createIcon(FiMessageSquare);
export const SettingsIcon = createIcon(FiSettings);
export const UsersIcon = createIcon(FiUsers);
