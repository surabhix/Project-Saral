import React, {Component} from 'react';
import {
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  Alert,
  BackHandler,
  LogBox,
  Share,
} from 'react-native';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {StackActions, NavigationActions} from 'react-navigation';
import SystemSetting from 'react-native-system-setting';
import Strings from '../../utils/Strings';
import AppTheme from '../../utils/AppTheme';
import Spinner from '../common/components/loadingIndicator';
import {OcrLocalResponseAction} from '../../flux/actions/apis/OcrLocalResponseAction';
import ScanHistoryCard from '../ScanHistory/ScanHistoryCard';
import SaralSDK from '../../../SaralSDK';
import {
  getScannedDataFromLocal,
  getErrorMessage,
  getLoginCred,
  setScannedDataIntoLocal,
} from '../../utils/StorageUtils';
import ButtonComponent from '../common/components/ButtonComponent';
import {
  askPermissions,
  checkAppVersion,
  checkNetworkConnectivity,
  dispatchCustomModalMessage,
  dispatchCustomModalStatus,
  monospace_FF,
  multipleStudent,
  neglectData,
} from '../../utils/CommonUtils';
import ShareComponent from '../common/components/Share';
import MultibrandLabels from '../common/components/multibrandlabels';
import {Assets} from '../../assets';
import CustomPopup from '../common/components/CustomPopup';
import ModalView from '../common/components/ModalView';
import DropDownMenu from '../common/components/DropDownComponent';
import {ROIAction} from '../StudentsList/ROIAction';
import APITransport from '../../flux/actions/transport/apitransport';
import {SaveScanData} from '../../flux/actions/apis/saveScanDataAction';
import axios from 'axios';
import {scanStatusDataAction} from '../ScanStatus/scanStatusDataAction';
import {collectErrorLogs} from '../CollectErrorLogs';
import ScanDataModal from './ScanDataModal';
import {
  getRoiDataApi,
  getScanDataApi,
  setRoiDataApi,
  setScanDataApi,
} from '../../utils/offlineStorageUtils';
import constants from '../../flux/actions/constants';
import {storeFactory} from '../../flux/store/store';
import DeviceInfo from 'react-native-device-info';
import {onScanButtonClickEvent} from '../../utils/Analytics';

LogBox.ignoreAllLogs();

class MyScanComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showFooter: true,
      oldBrightness: null,
      activityOpen: false,
      isLoading: false,
      scanStatusData: 0,
      roiDataList: [],
      selectedRoiLayoutData: '',
      roiIndex: -1,
      calledRoiData: false,
      saveStatusData: 0,
      localScanedData: [],
      dbScanSavedData: [],
      scanModalDataVisible: false,
      passDataToModal: [],
      savingStatus: '',
      examId: '',
      setIsLoading: false,
    };
  }

  async componentDidUpdate(prevProps) {
    const {calledRoiData} = this.state;
    const {roiData, minimalFlag, loginData, apiStatus} = this.props;
    if (calledRoiData) {
      if (roiData && prevProps.roiData != roiData && this.props.minimalFlag) {
        this.setState({calledRoiData: false, callApi: ''});
        if (roiData.status && roiData.status == 200) {
          let total = await this.sumOfLocalData();
          this.callScanStatusData(true, total, 0, null);
          if (
            loginData.data.school.hasOwnProperty('offlineMode') &&
            loginData.data.school.offlineMode
          ) {
            await this.setRoiCache(roiData);
          }
        }
      }

      if (apiStatus && prevProps.apiStatus != apiStatus && apiStatus.error) {
        this.setState({isLoading: false, calledLogin: false});
        if (roiData.length === 0) {
          this.callCustomModal(
            Strings.message_text,
            "Roi Doesn't Exist",
            false,
            false,
          );
        }
      }

      const hasNetwork = await checkNetworkConnectivity();
      if (calledRoiData & this.props.minimalFlag & !hasNetwork) {
        this.setState({calledRoiData: false});
        let total = await this.sumOfLocalData();
        this.callScanStatusData(true, total, 0, null);
      }
    }
  }

  async componentDidMount() {
    const {navigation, minimalFlag} = this.props;
    const {params} = navigation.state;
    navigation.addListener('willFocus', payload => {
      if (!minimalFlag) {
        this.sumOfLocalData();
      }
      if (params && params.from_screen && params.from_screen == 'scanDetails') {
        this.setState(
          {
            showFooter: false,
          },
          () => this.onScanClick(),
        );
      } else {
        this.setState({
          showFooter: true,
        });
      }
    });

    if (this.props.minimalFlag) {
      let examList = [];
      this.props.studentsAndExamData
        ? this.props.studentsAndExamData.data
          ? this.props.studentsAndExamData.data.exams
            ? this.props.studentsAndExamData.data.exams.map(el => {
                examList.push(el.type);
              })
            : []
          : []
        : [];

      this.setState({
        roiDataList: examList,
      });
    }
  }

  //functions
  sumOfLocalData = async () => {
    const {filteredData, roiData} = this.props;
    const data = await getScannedDataFromLocal();
    const loginCred = await getLoginCred();
    let len = 0;
    if (data) {
      let filter = data.filter(e => {
        let findSection = false;
        findSection = e.studentsMarkInfo.some(
          item => item.section == filteredData.section,
        );
        let checkDataExistence = false;
        if (!this.props.minimalFlag) {
          return (checkDataExistence =
            filteredData.class == e.classId &&
            e.examDate == filteredData.examDate &&
            e.subject == filteredData.subject &&
            findSection);
        } else if (
          this.props.loginData.data.school.hasOwnProperty('offlineMode') &
          this.props.loginData.data.school.offlineMode &
          this.props.minimalFlag
        ) {
          return (checkDataExistence =
            e.roiId == roiData.data.roiId &&
            e.key == this.props.loginData.data.school.schoolId);
        } else {
          return (checkDataExistence = e.roiId == roiData.data.roiId);
        }
      });

      let hasSet = filteredData
        ? filteredData.hasOwnProperty('set')
          ? filteredData.set.length >= 0
            ? filteredData.set
            : ''
          : null
        : '';
      if (
        hasSet != null &&
        hasSet != undefined &&
        hasSet.length >= 0 &&
        filter.length > 0
      ) {
        let findSetStudent =
          filter.length > 0
            ? filter[0].studentsMarkInfo.filter(item => {
                if (hasSet.length >= 0) {
                  return item.set == hasSet;
                }
              })
            : [];
        filter[0].studentsMarkInfo = findSetStudent;
      }

      filter.forEach((element, index) => {
        element.studentsMarkInfo.forEach(val => {
          if (val.studentAvailability == true && val.marksInfo.length > 0) {
            len = len + 1;
          }
        });
      });

      if (this.props.minimalFlag) {
        this.setState({localScanedData: filter});
      }

      this.setState({
        scanStatusData: len,
      });
    } else {
      this.setState({
        scanStatusData: 0,
      });
    }
    return len;
  };

  onBack = () => {
    if (this.state.activityOpen) {
      this.setState({
        showFooter: true,
        activityOpen: false,
      });
      SystemSetting.setBrightnessForce(this.state.oldBrightness).then(
        success => {
          if (success) {
            SystemSetting.saveBrightness();
          }
        },
      );
      SaralSDK.stopCamera().then(data => {
        if (data) {
          const resetAction = StackActions.reset({
            index: 0,
            actions: [
              NavigationActions.navigate({
                routeName: 'myScan',
                params: {from_screen: 'cameraActivity'},
              }),
            ],
          });
          this.props.navigation.dispatch(resetAction);
          return true;
        }
      });
      return true;
    } else {
      const {navigation} = this.props;
      const {params} = navigation.state;
      if (
        !this.props.minimalFlag &&
        params &&
        params.from_screen &&
        params.from_screen == 'cameraActivity'
      ) {
        this.props.navigation.navigate('ScanHistory', {
          from_screen: 'cameraActivity',
        });
        return true;
      } else {
        this.props.navigation.navigate('selectDetails', {
          from_screen: 'cameraActivity',
        });
        return true;
      }
    }
  };

  callCustomModal(title, message, isAvailable, cancel) {
    let data = {
      title: title,
      message: message,
      isOkAvailable: isAvailable,
      isCancel: cancel,
    };
    this.props.dispatchCustomModalStatus(true);
    this.props.dispatchCustomModalMessage(data);
  }

  setRoiCache = async roiData => {
    let payload = {
      examId: this.state.examId,
      data: roiData,
      key: `${this.props.loginData.data.school.schoolId}`,
      roiId: roiData.data.roiId,
    };
    let roi = await getRoiDataApi();
    if (roi != null) {
      let data = roi.filter(e => {
        if (
          (e.key == this.props.loginData.data.school.schoolId) &
          (e.examId == this.state.examId)
        ) {
          return true;
        }
      });
      if (data.length > 0) {
        for (let element of roi) {
          if (
            (element.key == data[0].key) &
            (element.examId == this.state.examId)
          ) {
            element.data = roiData;
            break;
          }
        }
      } else {
        let payload = {
          key: `${this.props.loginData.data.school.schoolId}`,
          data: roiData,
          examId: this.state.examId,
          roiId: roiData.data.roiId,
        };
        roi.push(payload);
      }
      await setRoiDataApi(roi);
      this.setState({isLoading: false});
    } else {
      await setRoiDataApi([payload]);
      this.setState({isLoading: false});
    }
  };

  setScanDataCache = async scanedData => {
    let payload = {
      examId: this.state.examId,
      data: scanedData,
      key: this.props.loginData.data.school.schoolId,
    };
    let scaned = await getScanDataApi();
    let setValue = this.props.filteredData.hasOwnProperty('set')
      ? this.props.filteredData.set.length > 0
        ? this.props.filteredData.set
        : ''
      : null;
    if (scaned != null) {
      let data = scaned.filter(value => {
        let conditionSwitch =
          setValue != null && setValue.length >= 0
            ? value.examId == this.state.examId &&
              value.key == this.props.loginData.data.school.schoolId &&
              this.props.filteredData.set == value.set
            : value.examId == this.state.examId &&
              value.key == this.props.loginData.data.school.schoolId;
        if (conditionSwitch) {
          return true;
        }
      });

      if (data.length > 0) {
        for (let element of scaned) {
          if (element.key == data[0].key) {
            element.data = scanedData;
            break;
          }
        }
      } else {
        if (setValue != null && setValue.length >= 0) {
          payload.set = setValue;
        }
        scaned.push(payload);
      }
      await setScanDataApi(scaned);
    } else {
      if (setValue != null && setValue.length >= 0) {
        payload.set = setValue;
      }
      await setScanDataApi([payload]);
    }
  };

  onScanClick = async () => {
    let hasUpdate = await checkAppVersion();
    if (!hasUpdate) {
      SystemSetting.getBrightness().then(brightness => {
        this.setState({oldBrightness: brightness});
      });

      let permissionStatus = await askPermissions();

      if (permissionStatus == 'granted') {
        let hasEmpty = this.props.roiData.hasOwnProperty('config')
          ? true
          : this.props.roiData.length > 0;
        if (this.props.minimalFlag && this.state.roiIndex != -1) {
          if (!hasEmpty) {
            this.callCustomModal(
              Strings.message_text,
              Strings.roi_cache_not_available,
              false,
              false,
            );
          } else {
            this.openCameraActivity();
            onScanButtonClickEvent(this.props.loginData.data.school.schoolId);
          }
        } else if (!this.props.minimalFlag) {
          if (
            this.props.loginData.data.school.hasOwnProperty('offlineMode') &&
            this.props.loginData.data.school.offlineMode &&
            hasEmpty
          ) {
            this.openCameraActivity();
            onScanButtonClickEvent(this.props.loginData.data.school.schoolId);
          } else if (
            this.props.loginData.data.school.hasOwnProperty('offlineMode') ==
              false ||
            (this.props.loginData.data.school.offlineMode == false && hasEmpty)
          ) {
            this.openCameraActivity();
            onScanButtonClickEvent(this.props.loginData.data.school.schoolId);
          } else {
            this.callCustomModal(
              Strings.message_text,
              Strings.roi_cache_not_available,
              false,
              false,
            );
          }
        }
      } else {
        let permissionStatus = await askPermissions();
        if (permissionStatus == 'granted') {
          if (this.props.minimalFlag && this.state.roiIndex != -1) {
            this.openCameraActivity();
            onScanButtonClickEvent(this.props.loginData.data.school.schoolId);
          } else if (!this.props.minimalFlag) {
            this.openCameraActivity();
            onScanButtonClickEvent(this.props.loginData.data.school.schoolId);
          } else {
            this.callCustomModal(
              Strings.message_text,
              Strings.please_select_roi_layout,
              false,
              false,
            );
          }
        } else if (permissionStatus == 'blocked') {
          Alert.alert(
            Strings.message_text,
            Strings.give_permission_from_settings,
            [{text: Strings.ok_text, style: 'cancel'}],
          );
        } else {
          Alert.alert(
            Strings.message_text,
            Strings.please_give_permission_to_use_app,
            [
              {text: Strings.cancel_text, style: 'cancel'},
              {text: Strings.ok_text, onPress: () => this.onScanClick()},
            ],
          );
        }
      }
    }
  };

  openCameraActivity = async () => {
    try {
      let permissionStatus = await askPermissions();

      if (permissionStatus == 'granted') {
        this.setState({
          activityOpen: true,
        });
        let totalPages =
          this.props.roiData.data.layout.hasOwnProperty('pages') &&
          this.props.roiData.data.layout.pages;
        let pageNumber = totalPages || totalPages > 0 ? '1' : null;
        let jsonRoiData = this.props.roiData.data;
        let hasTimer = this.props.loginData.data.school.hasOwnProperty(
          'scanTimeoutMs',
        )
          ? this.props.loginData.data.school.scanTimeoutMs
          : 0;
        let isManualEditEnabled =
          this.props.loginData.data.school.hasOwnProperty('isManualEditEnabled')
            ? this.props.loginData.data.school.isManualEditEnabled
            : false;
        SaralSDK.startCamera(
          JSON.stringify(jsonRoiData),
          pageNumber,
          hasTimer,
          isManualEditEnabled,
        )
          .then(res => {
            let roisData = JSON.parse(res);
            console.log(
              'roisData.hasOwnProperty("hwDigitModel")' +
                roisData.hasOwnProperty('hwDigitModel'),
            );

            if (
              roisData.hasOwnProperty('hwDigitModel') &&
              roisData.hwDigitModel
            ) {
              this.callCustomModal(
                Strings.message_text,
                Strings.Digit_model_is_not_availaible,
                false,
              );
            } else if (
              roisData.hasOwnProperty('blockLetterModel') &&
              roisData.blockLetterModel
            ) {
              this.callCustomModal(
                Strings.message_text,
                Strings.Alpha_numeric_model_is_not_availaible,
                false,
              );
            } else {
              let cells = roisData.layout.cells;
              this.consolidatePrediction(cells, roisData);
            }
          })
          .catch((code, message) => {
            console.log('code', code, message);
          });
      } else {
      }
    } catch (err) {}
  };

  consolidatePrediction(cells, roisData) {
    var marks = '';
    var predictionConfidenceArray = [];
    var studentIdPrediction = '';
    for (let i = 0; i < cells.length; i++) {
      marks = '';
      predictionConfidenceArray = [];
      for (let j = 0; j < cells[i].rois.length; j++) {
        if (cells[i].rois[j].hasOwnProperty('result')) {
          marks = marks + cells[i].rois[j].result.prediction;
          predictionConfidenceArray.push(cells[i].rois[j].result.confidence);
          // roisData.layout.cells[i].predictionConfidence = cells[i].rois[j].result.confidence
        } else {
          let resultProperty = {
            prediction: '0',
            confidence: 0,
          };
          roisData.layout.cells[i].rois[j].result = resultProperty;
        }
      }
      roisData.layout.cells[i].consolidatedPrediction = marks;
      roisData.layout.cells[i].predictionConfidence = predictionConfidenceArray;
      let rollNumber = roisData.layout.cells[i].format.name.replace(
        /[0-9]/g,
        '',
      );
      let checkRoLLNumberExist = '';

      if (roisData.layout.hasOwnProperty('identifierPrefix')) {
        checkRoLLNumberExist = roisData.layout.identifierPrefix;
      } else if (rollNumber == neglectData[0]) {
        checkRoLLNumberExist = rollNumber;
      } else {
        checkRoLLNumberExist = multipleStudent[0];
      }

      if (
        rollNumber === checkRoLLNumberExist &&
        rollNumber.length == checkRoLLNumberExist.length
      ) {
        roisData.layout.cells[i].studentIdPrediction = marks;
      } else if (
        rollNumber.trim() === checkRoLLNumberExist &&
        rollNumber != 0
      ) {
        roisData.layout.cells[i].studentIdPrediction = marks;
      } else {
        roisData.layout.cells[i].predictedMarks = marks;
      }
    }
    this.props.OcrLocalResponseAction(JSON.parse(JSON.stringify(roisData)));
    this.props.navigation.navigate('ScannedDetailsComponent', {
      oldBrightness: this.state.oldBrightness,
    });
  }

  async onDropDownSelect(idx, value) {
    for (const el of this.props.studentsAndExamData.data.exams) {
      if (el.type == value) {
        let hasNetwork = await checkNetworkConnectivity();
        let hasCacheData = await getRoiDataApi();
        let filterData =
          hasCacheData != null
            ? hasCacheData.filter(value => {
                if (
                  value.examId == el.examId &&
                  value.key == this.props.loginData.data.school.schoolId
                ) {
                  this.setState({
                    examId: el.examId,
                    isLoading: true,
                  });
                  return value.data;
                }
              })
            : [];

        if (hasCacheData && filterData.length > 0) {
          this.setState({calledRoiData: true});
          storeFactory.dispatch(this.dispatchroiData(filterData[0].data));
        } else if (hasNetwork) {
          this.setState(
            {
              calledRoiData: true,
              isLoading: true,
              examId: el.examId,
            },
            () => {
              let payload = {
                examId: el.examId,
              };
              let token = this.props.loginData.data.token;
              let apiObj = new ROIAction(payload, token);
              this.props.APITransport(apiObj);
            },
          );
        } else {
          storeFactory.dispatch(this.dispatchroiData({}));
          this.callCustomModal(
            Strings.message_text,
            Strings.you_dont_have_cache,
            false,
          );
          this.setState({isLoading: false});
          //Alert message show message "something went wrong or u don't have cache in local"
        }
        break;
      }
    }
    this.setState({
      roiIndex: idx,
      selectedRoi: value,
    });
  }

  dispatchroiData(payload) {
    return {
      type: constants.ROI_DATA,
      payload,
    };
  }

  onPressSaveInDB = async () => {
    const data = await getScannedDataFromLocal();
    const loginCred = await getLoginCred();
    const hasNetwork = await checkNetworkConnectivity();
    const deviceUniqId = await DeviceInfo.getUniqueId();
    if (hasNetwork) {
      if (this.state.roiIndex != -1) {
        if (data) {
          if (!this.props.bgFlag) {
            const filterData = data.filter(e => {
              let findOrgID = e.roiId == this.props.roiData.data.roiId;

              if (findOrgID) {
                return true;
              } else {
                return false;
              }
            });

            this.setState({
              isLoading: true,
            });
            let filterDataLen = 0;

            let setIntolocalAfterFilter = '';
            if (filterData.length != 0) {
              filterData.filter(f => {
                setIntolocalAfterFilter = data.filter(e => {
                  let findOrgID = e.roiId == this.props.roiData.data.roiId;
                  if (findOrgID) {
                    return false;
                  } else {
                    return true;
                  }
                });
              });

              let apiObj = new SaveScanData(
                filterData[0],
                this.props.loginData.data.token,
                deviceUniqId,
              );
              this.saveScanData(apiObj, filterDataLen, setIntolocalAfterFilter);
            } else {
              this.callCustomModal(
                Strings.message_text,
                Strings.there_is_no_data,
                false,
              );
              this.setState({
                isLoading: false,
              });
            }
          } else {
            this.callCustomModal(
              Strings.message_text,
              Strings.auto_sync_in_progress_please_wait,
              false,
            );
          }
        } else {
          this.setState({
            isLoading: false,
          });
          this.callCustomModal(
            Strings.message_text,
            Strings.there_is_no_data,
            false,
          );
        }
      } else {
        this.callCustomModal(
          Strings.message_text,
          Strings.please_select_roi_layout,
          false,
          true,
        );
      }
    } else {
      this.callCustomModal(
        Strings.message_text,
        Strings.please_try_again_later_network_is_not_available,
        false,
        true,
      );
    }
  };

  saveScanData = async (api, filteredDatalen, localScanData) => {
    var obj = this;
    if (api.method === 'PUT') {
      let apiResponse = null;
      const source = axios.CancelToken.source();
      const id = setTimeout(() => {
        if (apiResponse === null) {
          source.cancel('The request timed out.');
        }
      }, 60000);
      axios
        .put(api.apiEndPoint(), api.getBody(), {
          headers: api.getHeaders(),
          cancelToken: source.token,
        })
        .then(function (res) {
          apiResponse = res;
          clearTimeout(id);
          api.processResponse(res);
          obj.callScanStatusData(false, filteredDatalen, localScanData, res);
        })
        .catch(function (err) {
          if (err && err.response.status == 500) {
            obj.callCustomModal(
              Strings.message_text,
              Strings.lock_screen,
              false,
            );
          } else {
            collectErrorLogs(
              'MyScanComponent.js',
              'saveScanData',
              api.apiEndPoint(),
              err,
              false,
            );
            obj.callCustomModal(
              Strings.message_text,
              Strings.contactAdmin,
              false,
            );
            clearTimeout(id);
            obj.setState({
              isLoading: false,
            });
          }
        });
    }
  };

  callScanStatusData = async (
    isApiCalled,
    filteredDatalen,
    localScanData,
    res,
  ) => {
    const deviceUniqId = await DeviceInfo.getUniqueId();
    const {loginData} = this.props;
    let token = loginData.data.token;
    let hasNetwork = await checkNetworkConnectivity();
    if (!hasNetwork) {
      let hasCacheData = await getScanDataApi();
      if (hasCacheData) {
        let filterData = hasCacheData.filter(value => {
          if (value.examId == this.state.examId) {
            return value.data;
          }
        });
        if (filterData.length > 0) {
          storeFactory.dispatch(this.dispatchScanDataApi(filterData[0].data));
          this.setState({
            saveStatusData:
              filterData[0].data.data.length > 0
                ? filterData[0].data.data.data.length
                : 0,
          });
        } else {
          this.setState({isLoading: false});
          this.callCustomModal(
            Strings.message_text,
            Strings.you_dont_have_cache,
            false,
          );
        }
      } else {
        this.setState({isLoading: false});
        this.callCustomModal(
          Strings.message_text,
          Strings.you_dont_have_cache,
          false,
        );
        //Alert message show message "something went wrong or u don't have cache in local"
      }
    } else {
      let hasMessage = res
        ? typeof res.data == 'string'
          ? true
          : false
        : null;
      if (hasMessage != null && !hasMessage) {
        this.callCustomModal(
          Strings.message_text,
          Strings.saved_successfully,
          false,
        );
        setScannedDataIntoLocal(localScanData);
        this.dispatchScanDataApi(res.data);
        this.setState({
          localScanedData: [],
        });

        if (
          loginData.data.school.hasOwnProperty('offlineMode') &&
          loginData.data.school.offlineMode
        ) {
          this.setScanDataCache(res.data);
        }
        this.setState({
          scanStatusData: filteredDatalen,
          saveStatusData: res.data.data.length,
          isLoading: false,
          dbScanSavedData: res.data.data,
        });
      } else {
        let loginCred = await getLoginCred();
        let dataPayload = {
          classId: 0,
          subject: 0,
          section: 0,
          fromDate: 0,
          page: 0,
          downloadRes: false,
        };
        let roiId = this.props.roiData && this.props.roiData.data.roiId;
        dataPayload.roiId = roiId;
        let apiObj = new scanStatusDataAction(dataPayload, token, deviceUniqId);
        this.FetchSavedScannedData(
          isApiCalled,
          apiObj,
          loginCred.schoolId,
          loginCred.password,
          filteredDatalen,
          localScanData,
        );
      }
    }
  };

  FetchSavedScannedData = async (
    isApiCalled,
    api,
    uname,
    pass,
    filterDataLen,
    localScanData,
  ) => {
    const {loginData} = this.props;
    var obj = this;
    if (api.method === 'POST') {
      let apiResponse = null;
      const source = axios.CancelToken.source();
      const id = setTimeout(() => {
        if (apiResponse === null) {
          source.cancel('The request timed out.');
        }
      }, 60000);
      axios
        .post(api.apiEndPoint(), api.getBody(), {
          headers: api.getHeaders(),
          cancelToken: source.token,
        })
        .then(function (res) {
          apiResponse = res;
          clearTimeout(id);
          api.processResponse(res);
          if (!isApiCalled) {
            obj.callCustomModal(
              Strings.message_text,
              Strings.saved_successfully,
              false,
            );
            setScannedDataIntoLocal(localScanData);
            obj.setState({
              localScanedData: [],
            });
          }
          if (
            loginData.data.school.hasOwnProperty('offlineMode') &&
            loginData.data.school.offlineMode
          ) {
            obj.setScanDataCache(res.data);
          }
          obj.setState({
            scanStatusData: filterDataLen,
            saveStatusData: res.data.data.length,
            isLoading: false,
            dbScanSavedData: res.data.data,
          });
        })
        .catch(function (err) {
          collectErrorLogs(
            'MyScanComponent.js',
            'FetchSavedScannedData',
            api.apiEndPoint(),
            err,
            false,
          );
          obj.callCustomModal(
            Strings.message_text,
            Strings.something_went_wrong_please_try_again,
            false,
          );
          obj.setState({
            isLoading: false,
          });
          clearTimeout(id);
        });
    }
  };

  dispatchScanDataApi(payload) {
    return {
      type: constants.SCANNED_DATA,
      payload,
    };
  }

  setScanModalDataVisible() {
    const {scanModalDataVisible} = this.state;
    this.setState({
      scanModalDataVisible: false,
    });
  }

  async openScanModal(data) {
    const {localScanedData, dbScanSavedData, scanModalDataVisible} = this.state;
    const {roiIndex, loginData, filteredData} = this.props;

    if (this.state.roiIndex != -1) {
      if (data == 'scan') {
        this.setState({
          passDataToModal: localScanedData,
          scanModalDataVisible: !scanModalDataVisible,
          savingStatus: 'scan',
        });
      } else {
        const hasNetwork = await checkNetworkConnectivity();
        if (
          loginData.data.school.hasOwnProperty('offlineMode') &&
          loginData.data.school.offlineMode & !hasNetwork
        ) {
          let scaned = await getScanDataApi();
          let setValue = filteredData.hasOwnProperty('set')
            ? filteredData.set.length > 0
              ? filteredData.set
              : ''
            : null;
          let data = [];
          if (scaned != null) {
            data = scaned.filter(async e => {
              let conditionSwitch =
                setValue != null && setValue.length >= 0
                  ? e.examId == this.state.examId &&
                    e.key == this.props.loginData.data.school.schoolId &&
                    filteredData.set == e.set
                  : e.examId == this.state.examId &&
                    e.key == this.props.loginData.data.school.schoolId;
              if (conditionSwitch) {
                return true;
              }
            });
            let scannedData = data.length > 0 ? data[0].data.data.data : [];
            this.setState({
              passDataToModal: scannedData,
              scanModalDataVisible: !scanModalDataVisible,
              savingStatus: 'save',
            });
          }
        } else {
          this.setState({
            passDataToModal: dbScanSavedData,
            scanModalDataVisible: !scanModalDataVisible,
            savingStatus: 'save',
          });
        }
      }
    } else {
      this.callCustomModal(
        Strings.message_text,
        Strings.please_select_roi_layout,
        false,
        false,
      );
    }
  }

  render() {
    const {
      isLoading,
      saveStatusData,
      scanStatusData,
      scanModalDataVisible,
      passDataToModal,
      savingStatus,
    } = this.state;
    const {
      loginData,
      multiBrandingData,
      modalMessage,
      modalStatus,
      filteredData,
    } = this.props;
    const BrandLabel =
      multiBrandingData &&
      multiBrandingData.screenLabels &&
      multiBrandingData.screenLabels.myScan[0];

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: multiBrandingData
            ? multiBrandingData.themeColor2
            : AppTheme.WHITE_OPACITY,
        }}>
        {!this.props.minimalFlag ? (
          <ShareComponent
            navigation={this.props.navigation}
            onPress={() => this.props.navigation.navigate('StudentsList')}
          />
        ) : (
          <ShareComponent
            navigation={this.props.navigation}
            onPress={() => this.props.navigation.navigate('Home')}
          />
        )}
        <View>
          <View style={{margin: 5}}>
            {loginData && loginData.data && (
              <View>
                <Text
                  style={{
                    marginLeft: 5,
                    fontSize: AppTheme.FONT_SIZE_MEDIUM,
                    letterSpacing: 1,
                    fontFamily: monospace_FF,
                  }}>
                  {`${loginData.data.school.name}${
                    loginData.data.school.block
                      ? ', ' + loginData.data.school.block
                      : ''
                  }${
                    loginData.data.school.district
                      ? ', ' + loginData.data.school.district
                      : ''
                  }`}
                </Text>

                {!this.props.minimalFlag && (
                  <View
                    style={{
                      flexDirection: 'row',
                      marginLeft: 5,
                      marginTop: 5,
                    }}>
                    <Text style={{fontWeight: 'bold'}}>
                      {BrandLabel && BrandLabel.Class
                        ? BrandLabel.Class
                        : Strings.class_text + ' : '}
                      <Text style={{fontWeight: 'normal'}}>
                        {`${filteredData.className}, ${
                          filteredData.section ? filteredData.section : ''
                        }`}
                      </Text>
                    </Text>
                    <Text style={{marginLeft: 10, fontWeight: 'bold'}}>
                      {BrandLabel && BrandLabel.Subject
                        ? BrandLabel.Subject
                        : Strings.subject + ' : '}
                      <Text style={{fontWeight: 'normal'}}>
                        {filteredData.subject}{' '}
                        {filteredData.set ? `(Set ${filteredData.set})` : ''}
                      </Text>
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {!this.props.minimalFlag ? (
          <ScrollView scrollEnabled>
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 15,
              }}>
              <Text style={{fontWeight: 'bold', fontSize: 18}}>
                {Strings.Summary_page}
              </Text>
            </View>
            <ScanHistoryCard
              scanstatusbutton={true}
              scanFun={this.onScanClick}
              themeColor1={
                this.props.multiBrandingData
                  ? this.props.multiBrandingData.themeColor1
                  : AppTheme.BLUE
              }
              showButtons={false}
              scanStatusData={this.state.scanStatusData}
              setScanStatusData={() => this.setState({scanStatusData: 0})}
              navigation={this.props.navigation}
              // isLoading={isLoading}
              setIsLoading={() => this.setState({isLoading: false})}
            />
          </ScrollView>
        ) : (
          <View style={{marginHorizontal: 20, marginTop: 30, marginBottom: 40}}>
            <DropDownMenu
              options={this.state.roiDataList}
              onSelect={async (idx, value) =>
                await this.onDropDownSelect(idx, value)
              }
              defaultData={BrandLabel ? BrandLabel.SelectRoi : 'Select Roi'}
              defaultIndex={this.state.roiIndex}
              selectedData={this.state.selectedRoi}
              icon={require('../../assets/images/arrow_down.png')}
            />
          </View>
        )}

        {this.props.minimalFlag && (
          <ScrollView scrollEnabled>
            <View
              style={{
                backgroundColor: multiBrandingData
                  ? multiBrandingData.themeColor1
                  : AppTheme.BLUE,
                marginHorizontal: 20,
                padding: 6,
                borderRadius: 10,
                paddingBottom: 16,
                paddingTop: 14,
                width: '90%',
                justifyContent: 'center',
                alignSelf: 'center',
              }}>
              <View style={styles.scanCardStyle}>
                <View
                  style={[
                    styles.scanLabelStyle,
                    styles.scanLabelKeyStyle,
                    {padding: '3.4%'},
                  ]}>
                  <Text style={{fontFamily: monospace_FF}}>
                    {BrandLabel && BrandLabel.ScanCount
                      ? BrandLabel.ScanCount
                      : Strings.scan_count}
                  </Text>
                </View>
                <View
                  style={[
                    styles.scanLabelStyle,
                    styles.scanLabelValueStyle,
                    {padding: '3.4%'},
                  ]}>
                  <Text style={{fontFamily: monospace_FF}}>
                    {scanStatusData}
                  </Text>
                </View>
              </View>

              <View style={styles.scanCardStyle}>
                <View
                  style={[
                    styles.scanLabelStyle,
                    styles.scanLabelKeyStyle,
                    {padding: '3.4%', borderBottomWidth: 1},
                  ]}>
                  <Text style={{fontFamily: monospace_FF}}>
                    {BrandLabel && BrandLabel.SaveCount
                      ? BrandLabel.SaveCount
                      : Strings.save_count}
                  </Text>
                </View>
                <View
                  style={[
                    styles.scanLabelStyle,
                    styles.scanLabelValueStyle,
                    {padding: '3.4%', borderBottomWidth: 1},
                  ]}>
                  <Text style={{fontFamily: monospace_FF}}>
                    {saveStatusData}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  flexWrap: 'wrap',
                  flexDirection: 'row',
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 10,
                }}>
                <ButtonComponent
                  customBtnStyle={[
                    styles.nxtBtnStyle1,
                    {
                      backgroundColor: AppTheme.WHITE,
                      height: 30,
                      width: '45%',
                      marginHorizontal: 0,
                      marginRight: 10,
                    },
                  ]}
                  btnText={Strings.saved_data}
                  activeOpacity={0.8}
                  customBtnTextStyle={{
                    fontFamily: monospace_FF,
                    fontSize: 13,
                    color: AppTheme.BLACK,
                  }}
                  onPress={() => this.openScanModal('save')}
                />

                <ButtonComponent
                  customBtnStyle={[
                    styles.nxtBtnStyle1,
                    {
                      backgroundColor: AppTheme.WHITE,
                      height: 30,
                      width: '50%',
                      marginHorizontal: 0,
                    },
                  ]}
                  btnText={Strings.scan_data}
                  activeOpacity={0.8}
                  customBtnTextStyle={{
                    fontFamily: monospace_FF,
                    fontSize: 13,
                    color: AppTheme.BLACK,
                  }}
                  onPress={() => this.openScanModal('scan')}
                />

                <ButtonComponent
                  customBtnStyle={[
                    styles.nxtBtnStyle1,
                    {
                      backgroundColor: AppTheme.WHITE,
                      height: 30,
                      width: '45%',
                      marginHorizontal: 0,
                    },
                  ]}
                  btnText={Strings.save_all_scan}
                  activeOpacity={0.8}
                  customBtnTextStyle={{
                    fontFamily: monospace_FF,
                    fontSize: 13,
                    color: AppTheme.BLACK,
                  }}
                  onPress={this.onPressSaveInDB}
                />
              </View>
            </View>
          </ScrollView>
        )}

        <View></View>

        <View
          style={[
            {
              backgroundColor: 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}>
          <Text
            style={{
              bottom: 10,
              elevation: 20,
              fontSize: 18,
              fontWeight: 'bold',
            }}>
            click here to scan
          </Text>

          <TouchableOpacity
            style={[styles.subTabContainerStyle]}
            onPress={this.onScanClick}>
            <Image
              source={Assets.scan}
              style={styles.tabIconStyle}
              resizeMode={'contain'}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.bottomTabStyle}></View>
        {isLoading && (
          <Spinner
            animating={isLoading}
            customContainer={{opacity: 0.6, elevation: 15}}
          />
        )}
        <CustomPopup
          title={'Message'}
          ok_button={'Ok'}
          bgColor={
            multiBrandingData ? multiBrandingData.themeColor1 : AppTheme.BLUE
          }
        />
        <ModalView modalVisible={modalStatus} modalMessage={modalMessage} />
        <ScanDataModal
          setModalVisible={() => this.setScanModalDataVisible()}
          modalVisible={scanModalDataVisible}
          localstutlist={passDataToModal}
          minimalFlag={this.props.minimalFlag}
          savingStatus={savingStatus}
          bgColor={
            this.props.multiBrandingData
              ? this.props.multiBrandingData.themeColor1
              : AppTheme.BLUE
          }
          navigation={this.props.navigation}
          saveData={this.onPressSaveInDB}
        />
      </View>
    );
  }
}

const styles = {
  container1: {
    marginHorizontal: '4%',
    alignItems: 'center',
    marginTop: 10,
  },
  onGoingContainer: {
    marginHorizontal: '4%',
    alignItems: 'center',
    paddingVertical: '3%',
  },
  header1TextStyle: {
    backgroundColor: AppTheme.LIGHT_BLUE,
    lineHeight: 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AppTheme.LIGHT_BLUE,
    width: '100%',
    textAlign: 'center',
    fontSize: AppTheme.FONT_SIZE_SMALL,
    color: AppTheme.BLACK,
    letterSpacing: 1,
  },
  bottomTabStyle: {
    flexDirection: 'row',

    height: 35,
    left: 0,
    right: 0,
    backgroundColor: AppTheme.WHITE,
    elevation: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subTabContainerStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },

  tabIconStyle: {
    width: 80,
    height: 80,
  },
  Backbutton: {
    width: 200,
    lineHeight: 40,
    textAlign: 'center',
    fontSize: AppTheme.FONT_SIZE_LARGE,
    color: AppTheme.BLACK,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  tabLabelStyle: {
    height: 70,
    lineHeight: 40,
    textAlign: 'center',
    fontSize: AppTheme.FONT_SIZE_SMALL,
    color: AppTheme.BLACK,
    letterSpacing: 1,
    fontWeight: 'bold',
    fontFamily: monospace_FF,
  },
  scanTabContainerStyle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanSubTabContainerStyle: {
    width: '90%',
    height: '90%',
    marginBottom: 30,
    backgroundColor: AppTheme.BLUE,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nxtBtnStyle: {
    marginHorizontal: 40,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 10,
  },

  nxtBtnStyle1: {
    marginTop: 15,
    width: '90%',
    height: 52,
    marginHorizontal: 20,
    bottom: 0,
    borderRadius: 10,
  },
  viewnxtBtnStyle1: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanCardStyle: {
    flexDirection: 'row',
    paddingHorizontal: '2%',
  },
  scanLabelStyle: {
    padding: '2.4%',
    borderTopWidth: 1,
    borderColor: AppTheme.BLACK,
  },
  scanLabelKeyStyle: {
    width: '40%',
    backgroundColor: AppTheme.TAB_BORDER,
    borderLeftWidth: 1,
    borderRightWidth: 0.5,
  },
  scanLabelValueStyle: {
    width: '60%',
    backgroundColor: AppTheme.WHITE,
    borderLeftWidth: 0.5,
    borderRightWidth: 1,
  },
};

const mapStateToProps = state => {
  return {
    ocrLocalResponse: state.ocrLocalResponse,
    loginData: state.loginData,
    filteredData: state.filteredData.response,
    scanTypeData: state.scanTypeData.response,
    scanedData: state.scanedData,
    roiData: state.roiData.response,
    multiBrandingData: state.multiBrandingData.response.data,
    apiStatus: state.apiStatus,
    modalStatus: state.modalStatus,
    modalMessage: state.modalMessage,
    minimalFlag: state.minimalFlag,
    studentsAndExamData: state.studentsAndExamData,
    bgFlag: state.bgFlag,
  };
};

const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      OcrLocalResponseAction: OcrLocalResponseAction,
      dispatchCustomModalStatus: dispatchCustomModalStatus,
      dispatchCustomModalMessage: dispatchCustomModalMessage,
      APITransport: APITransport,
    },
    dispatch,
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(MyScanComponent);
