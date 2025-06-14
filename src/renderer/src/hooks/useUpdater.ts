import { useState, useEffect } from 'react';
import { UpdateInfo, UpdateProgress } from '../types/electron';

export interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';
  updateInfo?: UpdateInfo;
  downloadProgress?: UpdateProgress;
  error?: string;
}

export function useUpdater() {
  const [updateState, setUpdateState] = useState<UpdateState>({ status: 'idle' });
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // 更新イベントのリスナーを設定
    window.api.onUpdateChecking(() => {
      setUpdateState({ status: 'checking' });
    });

    window.api.onUpdateAvailable((info: UpdateInfo) => {
      setUpdateState({ status: 'available', updateInfo: info });
    });

    window.api.onUpdateNotAvailable(() => {
      setUpdateState({ status: 'idle' });
    });

    window.api.onUpdateDownloadProgress((progress: UpdateProgress) => {
      setUpdateState(prev => ({ ...prev, status: 'downloading', downloadProgress: progress }));
    });

    window.api.onUpdateDownloaded(() => {
      setUpdateState(prev => ({ ...prev, status: 'downloaded' }));
    });

    window.api.onUpdateError((error: string) => {
      setUpdateState({ status: 'error', error });
    });

    // クリーンアップ
    return () => {
      window.api.removeAllUpdateListeners();
    };
  }, []);

  const checkForUpdate = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const result = await window.api.checkForUpdate();
      if (!result.success && result.error) {
        setUpdateState({ status: 'error', error: result.error });
      }
    } catch (error) {
      setUpdateState({ status: 'error', error: (error as Error).message });
    } finally {
      setIsChecking(false);
    }
  };

  const downloadUpdate = async () => {
    try {
      const result = await window.api.downloadUpdate();
      if (!result.success && result.error) {
        setUpdateState({ status: 'error', error: result.error });
      }
    } catch (error) {
      setUpdateState({ status: 'error', error: (error as Error).message });
    }
  };

  const installUpdate = async () => {
    try {
      const result = await window.api.installUpdate();
      if (!result.success && result.error) {
        setUpdateState({ status: 'error', error: result.error });
      }
      return result;
    } catch (error) {
      setUpdateState({ status: 'error', error: (error as Error).message });
      return { success: false, error: (error as Error).message };
    }
  };

  return {
    updateState,
    isChecking,
    checkForUpdate,
    downloadUpdate,
    installUpdate,
  };
}