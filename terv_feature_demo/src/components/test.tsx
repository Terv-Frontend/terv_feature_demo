import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SignalWifiOffIcon from "@material-ui/icons/SignalWifiOff";
import { toast, Slide, ToastContainer } from "react-toastify";
import cn from "classnames";
import moment from "moment";
import qs from "query-string";
import { useElapsedTime } from "use-elapsed-time";
import {
  Box,
  ThemeProvider,
  Typography,
  useMediaQuery,
} from "@material-ui/core";
import { createTheme } from "@material-ui/core/styles";
import { getData, postData } from "../../api";
import { sessionPrivileges } from "privileges";
import { apiList } from "../../api/list";
import api from "api/baseConfig";
import Apihelper from "api/apiHelper";
import { useHistory, useLocation } from "react-router-dom";
import { Content } from "./components/content/content";
import { Summary } from "./components/summary/summary";
import { HeaderFooter } from "./components/header-footer/header-footer";
import { JitsiProctoring } from "./components/jitsi/jitsi";
import { Loader } from "./components/loader/loader";
import { AssessmentInstruction } from "./components/question-section/AssessmentInstruction";
import { ProctorDetector } from "./components/proctor-detector/proctor-detector";
import { ProctorAiDetector } from "./components/proctor-detector/proctorAi-detector";
import { SideNav } from "./components/sidenav/sidenav";
import { TestContext } from "./context/test.context";
import {
  TStateCodeLanguages,
  TStateCodeSolutions,
  TStateCurrentQuestion,
  TStateCurrentSection,
  TStateCurrentTabItem,
  TStateDescriptiveAnswers,
  TStateSectionData,
  TStateSelectedOptions,
} from "./test.props";
import styles from "./test.module.scss";
import { Info } from "@material-ui/icons";
import { useParams } from "react-router-dom";
import questions from "store/question/reducer";
import Detection from "pages/AiProctring/proctring";
import { Callback } from "@tensorflow/tfjs";
import { any } from "prop-types";

interface reportInterface {
  report: boolean | null;
  reportmsg: string | null;
  codemsg: string | null;
}

function getMuiTheme(lightTheme: boolean, isSmallScreen: boolean) {
  return createTheme({
    palette: {
      type: lightTheme ? "light" : "dark",
      primary: lightTheme
        ? {
            contrastText: "#fff",
            main: "#794DF5",
          }
        : {
            contrastText: "#fff",
            main: "#1BA94C",
          },
    },
    overrides: {
      MuiAppBar: {
        root: {
          backgroundColor: lightTheme ? "#2A153D" : "#242744",
          borderRadius: "0 !important",
          boxShadow: "none",
        },
      },
      MuiToolbar: {
        root: {
          backgroundColor: lightTheme ? "#2A153D" : "#242744",
        },
      },
      MuiButton: {
        text: {
          padding: "6px 20px",
        },
        root: {
          color: "#fff",
          borderRadius: 4,
        },
        label: {
          fontSize: 14,
          lineHeight: 1.8,
          textTransform: "capitalize",
        },
        sizeLarge: {
          height: 42,
        },
        sizeSmall: {
          height: 28,
        },
      },
      MuiPaper: {
        root: {
          backgroundColor: lightTheme
            ? "#F6F9FC"
            : isSmallScreen
            ? "#222"
            : "#001527",
          borderRadius: "6px !important",
          overflow: "hidden",
        },
      },
      MuiMenu: {
        paper: {
          backgroundColor: "#fff",
          boxShadow: "rgba(0, 0, 0, 0.2) 0 8px 24px 0px !important",
        },
      },
    },
    props: {
      MuiButton: {
        disableElevation: true,
      },
    },
    typography: {
      fontFamily: "Poppins, sans-serif",
    },
  });
}

export default function Test() {
  const [loadingTest, setIfLoadingTest] = useState(true);
  const smallScreen = useMediaQuery("(max-width: 767px)");
  const mediumScreen = useMediaQuery(
    "(min-width: 768px) and (max-width: 1023px)"
  );
  const largeScreen = useMediaQuery("(min-width: 1024px)");
  const userPrivileges = sessionPrivileges();
  const userId = userPrivileges.userName;
  const assessmentId = qs.parse(window.location.search).id?.toString() || "";
  const labId = qs.parse(window.location.search).labId?.toString() || "";
  const [startTime, setStartTime] = useState(() => new Date());
  const [counterTest, setCounterTest] = useState(0);
  const [totalTime, setTotalTime] = useState<number>(40000);
  const [sepcificTotalTime, setSepcificTotalTime] = useState<number | null>(
    1000
  );
  const [aiProctoring, setAiProctoring] = useState<boolean>(false);
  const [timerStart, setTimerStart] = useState<boolean>(false);
  const [sectionValue, setSectionValue] = useState<boolean>(false);
  const [lastQuestion, setLastQuestion] = useState();
  const [lastSectionId, setLastSectionId] = useState();
  const isAdmin =
    qs.parse(window.location.search)?.isAdmin?.toString() || "false";
  const customer =
    qs.parse(window.location.search)?.customerId?.toString() || "";
  const isActivePage = qs.parse(window.location.search)?.activePage || "";
  const isActiveTab = qs.parse(window.location.search)?.activeTab || "";
  const isMockAssessment = qs.parse(window.location.search)?.isMockAssessment;
  const learningPathIndex = qs.parse(window.location.search)?.learningPathIndex;

  const history = useHistory();
  const { state } = useLocation<any>();
  const isFromPrepare = state?.isFromPrepare || false;
  const courseId = state?.courseId || "";
  const isHackathon = state?.isHackathon || "";
  const hackathonId = state?.hackathonId || "";
  const prepCourseId = state?.prepCourseId || "";
  const prepCourseName = state?.prepCourseName || "";
  const prepCoursePer = state?.prepCoursePer || "";
  const prepPracCompletionCriteria = state?.prepPracCompletionCriteria || "";
  const prepPracResId = state?.prepPracResId || "";
  const prepPracModId = state?.prepPracModId || "";

  const [answeredQuestions, setAnsweredQuestions] = useState<{
    [key: string]: boolean;
  }>({});
  const [flaggedValueQuestions, setFlaggedValueQuestions] = useState<{
    [key: string]: boolean;
  }>({});
  const [apiRequestId, setApiRequestId] = useState("");
  const [assessmentData, setAssessmentData] = useState<any>({});
  const [codeEditorIsInLightMode, setIfCodeEditorIsInLightMode] =
    useState<boolean>(true);
  const [codeLanguages, setCodeLanguages] = useState<TStateCodeLanguages>([]);
  const [codeSolutions, updateCodeSolutions] = useState<TStateCodeSolutions>(
    {}
  );
  const [currentQuestion, setCurrentQuestion] = useState<TStateCurrentQuestion>(
    {
      answered: false,
      flagged: false,
      id: "",
      isCodingType: false,
      num: 1,
      type: "MC",
      report: false,
      reportmsg: "",
      timeLimit: null,
    }
  );
  const [currentSection, setCurrentSection] = useState<TStateCurrentSection>({
    id: "",
    num: 0,
  });
  const [currentSectionQuestionIds, setCurrentSectionQuestionIds] = useState<
    string[]
  >([]);
  const [currentFlagQuestionIds, setCurrentFlagQuestionIds] = useState<
    string[]
  >([]);
  const [currentTab, setCurrentTab] =
    useState<TStateCurrentTabItem>("question");
  const [customInput, setCustomInput] = useState("");
  const [descriptiveAnswers, setDescriptiveAnswers] =
    useState<TStateDescriptiveAnswers>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<{
    [key: string]: boolean;
  }>({});
  const [reportedQuestions, setReportedQuestions] = useState<{
    [key: string]: boolean;
  }>({});
  const [reportedMsgQuestions, setReportedMsgQuestions] = useState<{
    [key: string]: string;
  }>({});
  const [answeredQuestionPointer, setAnsweredQuestionPointer] = useState<{
    [key: string]: boolean;
  }>({});
  const [allowedRestrictedActionsCount, setAllowedRestrictedActionsCount] =
    useState<number>(100000);
  const [checkRestrict, setCheckRestrict] = useState(false);
  const [checkAllQuestions, setCheckAllQuestions] = useState(false);
  const [restrictedActionCount, setRestrictedActionCount] = useState<number>(0);
  const [restrictedContinue, setRestrictedContinue] = useState<number>(0);
  const [gradingOnProcess, setIfGradingOnProcess] = useState(false);
  const [lightMode, setIfLightMode] = useState(true);
  const [inFullScreenMode, setIfInFullScreenMode] = useState(false);
  const [online, setIfOnline] = useState(true);
  const [testIsLoaded, setIfTestIsLoaded] = useState(false);
  const [output, setOutput] = useState("");
  const [outputIsVisible, setIfOutputIsVisible] = useState(false);
  const [outputTab, setOutputTab] = useState(0);
  const [proctor, setProctor] = useState({
    hasAccess: false,
    room: "",
    server: "",
  });
  const [proctorAi, setProctorAi] = useState(false);
  const [runningCode, setIfRunningCode] = useState<boolean>(false);
  const [sectionIds, setSectionIds] = useState<string[]>([]);
  const [sections, setSections] = useState<{
    [key: string]: TStateSectionData;
  }>({});
  const [selectedOptions, updateSelectedOptions] =
    useState<TStateSelectedOptions>({});
  const [sidebarIsVisible, setSidebarVisibility] = useState<boolean>(false);
  const [submittingSolution, setIfSubmittingSolution] =
    useState<boolean>(false);
  const [submittingTest, setIfSubmittingTest] = useState<boolean>(false);
  const [testSummaryIsOpen, setIfTestSummaryIsOpen] = useState<boolean>(false);
  const [timeLimit, setTimeLimit] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [timeType, setTimeType] = useState("");
  const [previousTimerValue, setPreviousTimerValue] = useState(0);
  const [reportMessage, setReportMessage] = useState("");
  const [reportmsg, setReportmsg] = useState("");
  const [seconds, setSeconds] = useState(false);
  const [customerLogo, setCustomerLogo] = useState({productName:"", productLogo:""});
  const [totalQuestion, setTotalQuestions] = useState(0);
  const [timeLimitQuestions, setTimeLimitQuestions] = useState<{
    [key: string]: number;
  }>({});

  const { elapsedTime, reset } = useElapsedTime({
    isPlaying: isAdmin === "true" ? false : loadingTest == false ? timerStart : false,
    updateInterval: 1,
    onUpdate(et) {
      const specficQue = currentQuestion?.timeLimit;
      if (et >= totalTime) {
        submitAssessment(true, true);
      }
      if (timeType === "time" || timeType === "duration") {
        if (totalTime - et === (totalTime > 120 ? 60 : totalTime/2)) {
          issueLastFewMinsWarning(totalTime >= 120 ? "1 minute" : `${totalTime/2} seconds`);
        }
      } else if (timeType === "question" && specficQue) {
        const quesTime = Math.round(specficQue * 60);
        if (quesTime - et === (quesTime > 60 ? 30 : (quesTime/2))) {
          issueLastFewMinsWarning(`few seconds`);
        }
        if(specficQue && et >= specficQue * 60) {
          reset(0);
          navNextQuestion();
        }
      }
    }
  });

  const getCustomerLogo = async () => {
    try {
      const data = await Apihelper.axiosCall(
        `${api.baseURL}${api.homePage.getCustomerLogo}`,
        "get"
      );
      if (data && data.productLogo) {
        setCustomerLogo(data)
      }
    } catch (e) {}
  };

  let checkRestrictValue = useRef<any>(false);
  useEffect(() => {
    if (sessionStorage.getItem("user_id") == null) backTologin();
  }, []);
  function backTologin() {
    window.location.href = `/login${window.location.search}`;
  }
  const restrictedActionToast = useRef<any>(null);
  const docElem: any = document.documentElement;
  const doc: any = document;

  const theme = useMemo(
    () => getMuiTheme(lightMode, smallScreen),
    [smallScreen, lightMode]
  );
  const numFlaggedQuestions = useMemo(
    () => Object.values(flaggedQuestions).filter((f) => f).length || 0,
    [flaggedQuestions]
  );

  const numReportedQuestions = useMemo(
    () => Object.values(reportedQuestions).filter((f) => f).length || 0,
    [reportedQuestions]
  );

  const numReportedMsgQuestions = useMemo(
    () => Object.values(reportedMsgQuestions).filter((f) => f).length || 0,
    [reportedMsgQuestions]
  );

  const numAnsweredQuestions = useMemo(
    () => Object.values(answeredQuestions).filter((a) => a).length || 0,
    [answeredQuestions]
  );

  const [allSectionQuestionArray, setAllSectionQuestionArray] = useState<
    reportInterface[][]
  >([]);

  const numQuestions = useMemo(() => {
    let totalQuestions = 0;
    let tempSection: reportInterface[][] = [];
    Object.values(sections).forEach((section) => {
      let tempQuestion: reportInterface[] = [];
      section.questions.forEach((ques) => {
        let reportData = {
          report: ques.report ? ques.report : null,
          reportmsg: ques.reportmsg ? ques.reportmsg : null,
          codemsg: ques.savedCodeSolution ? window.atob(ques.savedCodeSolution) : null,
        };
        tempQuestion.push(reportData);
        totalQuestions += 1;
      });
      tempSection.push(tempQuestion);
    });
    setAllSectionQuestionArray(tempSection);
    return totalQuestions;
  }, [sections]);

  const currentSectionFlaggedQuestionIds = useMemo(
    () => currentSectionQuestionIds.filter((qId) => flaggedQuestions?.[qId]),
    [flaggedQuestions, currentSectionQuestionIds]
  );

  const currentSectionReportedQuestionsIds = useMemo(
    () => currentSectionQuestionIds.filter((qId) => reportedQuestions?.[qId]),
    [reportedQuestions, currentSectionQuestionIds]
  );

  const currentSectionReportedMsgQuestionsIds = useMemo(
    () =>
      currentSectionQuestionIds.filter((qId) => reportedMsgQuestions?.[qId]),
    [reportedMsgQuestions, currentSectionQuestionIds]
  );

  const currentSectionAnsweredQuestionIds = useMemo(
    () => currentSectionQuestionIds.filter((qId) => answeredQuestions?.[qId]),
    [answeredQuestions, currentSectionQuestionIds]
  );

  const currentQuestionData = useMemo(
    () => sections?.[currentSection.id]?.questions?.[currentQuestion.num - 1],
    [sections, currentQuestion, currentSection]
  );

  const updateCurrentQuestion = useCallback(
    (sectionId: string, newCurrentQuestion: any) => {
      setCurrentQuestion({
        id: newCurrentQuestion?.id || "",
        num:
          sections[sectionId]?.questions?.findIndex(
            ({ id }) => id === newCurrentQuestion?.id
          ) + 1 || 1,
        type: newCurrentQuestion?.type,
        isCodingType: newCurrentQuestion?.type === "CD",
        flagged: flaggedQuestions?.[newCurrentQuestion?.id],
        answered: answeredQuestions?.[newCurrentQuestion?.id],
        report: reportedQuestions?.[newCurrentQuestion?.id],
        reportmsg: reportMessage,
        timeLimit: newCurrentQuestion?.timeLimit,
      });
    },
    [sections, answeredQuestions, flaggedQuestions, reportedQuestions]
  );
  
  const landingCurrentQuestion = useCallback(
    (newCurrentQuestion: any, lastSectionId: any) => {
      setCurrentQuestion({
        id: newCurrentQuestion?.id || "",
        num:
          lastSectionId?.findIndex(({ id } : any) => id === newCurrentQuestion?.id) +
            1 || 1,
        type: newCurrentQuestion?.type,
        isCodingType: newCurrentQuestion?.type === "CD",
        flagged: flaggedQuestions?.[newCurrentQuestion?.id],
        answered: answeredQuestions?.[newCurrentQuestion?.id],
        report: reportedQuestions?.[newCurrentQuestion?.id],
        reportmsg: reportMessage,
        timeLimit: newCurrentQuestion?.timeLimit,
      });
    },
    [
      sections,
      answeredQuestions,
      flaggedQuestions,
      reportedQuestions,
      reportedMsgQuestions,
    ]
  );

  useEffect(() => {
    if (lastQuestion) {
      let sectionArray: any = [];
      sectionIds?.map((e: any) => sectionArray.push(sections[e]));
      let lastSecId = sectionArray.filter((e: any) => {
        return e?.sectionId == lastSectionId;
      });
      let lastQueId = lastSecId[0]?.questions.filter((e: any) => {
        return e?.id == lastQuestion;
      });
      landingCurrentQuestion(lastQueId?.[0], lastSecId?.[0]?.questions);
    }
  }, [lastQuestion, lastSectionId]);

  const flagQuestion = useCallback(() => {
    setFlaggedQuestions((fq) => ({
      ...fq,
      [currentQuestion.id]: !fq?.[currentQuestion.id],
    }));
    flagApiSend();
  }, [currentQuestion]);

  const reportQuestion = useCallback(
    (id: string, msg: string) => {
      setReportedQuestions((fq) => ({
        ...fq,
        [currentQuestion.id]: !fq?.[currentQuestion.id],
      }));
      reportProblem(id, msg);
    },
    [currentQuestion]
  );
  const timeLimitQuestion = () => {
    setSepcificTotalTime(currentQuestion?.timeLimit || null);
  };

  useEffect(() => {
    timeLimitQuestion();
  }, [sections, timeLimitQuestions, currentQuestion]);

  const navToQuestionViaSectionSelector = useCallback(
    (sectionId: string,) => {
      const newQuestionsList = sections[sectionId]?.questions;
      const newCurrentQuestion = newQuestionsList?.[1];
      if (newCurrentQuestion) {
        setCurrentSection({
          id: sectionId,
          num: sectionIds?.findIndex?.((id) => id === sectionId) + 1,
        });

        updateCurrentQuestion(sectionId, newCurrentQuestion);
      } else {
        updateCurrentQuestion(sectionId, newQuestionsList?.[0]);
      }
    },
    [sections, currentQuestion, sectionIds]
  );

  const setCurrentSectionDetails = useCallback(
    (sectionId, cb = undefined) => {
      setCurrentSection({
        id: sectionId,
        num: sectionIds?.findIndex?.((id) => id === sectionId) + 1,
      });
      navToQuestionViaSectionSelector(sectionId);
      cb?.();
    },
    [sections, sectionIds]
  );

  const lastViewedQuestion = async (questionId: any, sectionId: any) => {
    try {
      const res = await Apihelper.axiosCall(
        `${api.baseURL}${api.assessmentController.lastQuestionUpdate}${assessmentId}/${questionId}/${sectionId}`,
        "POST"
      );
    } catch (error) {}
  };

  const navPrevQuestion = useCallback(() => {
    const newQuestionsList = sections[currentSection.id]?.questions;
    const newCurrentQuestion = newQuestionsList?.[currentQuestion.num - 2];

    if (newCurrentQuestion) {
      updateCurrentQuestion(currentSection.id, newCurrentQuestion);
    } else {
      updateCurrentQuestion(currentSection.id, newQuestionsList?.[0]);
    }
  }, [sections, currentSection, currentQuestion]);

  const navNextQuestion = useCallback(() => {
    const newQuestionsList = sections[currentSection.id]?.questions;
    const sectionIdValue = sections[currentSection.id]?.sectionId;
    const newCurrentQuestion = newQuestionsList?.[currentQuestion.num];
    if (newCurrentQuestion) {
      updateCurrentQuestion(currentSection.id, newCurrentQuestion);
      if (timeType == "question") {
        lastViewedQuestion(newCurrentQuestion?.id, sectionIdValue);
      }
    } else {
      let currentSectionId = -1;
      sectionIds.map((id, index) => {
        if (id === currentSection.id) {
          currentSectionId = index;
        }
      });
      if (currentSectionId > -1 && currentSectionId < sectionIds?.length - 1) {
        setCurrentSectionDetails(sectionIds[currentSectionId + 1], () => {
          const newCurrentQuestion = sections[sectionIds[currentSectionId + 1]]?.questions?.[0];
          updateCurrentQuestion(currentSection.id, newCurrentQuestion);
          if (timeType == "question") {
            lastViewedQuestion(newCurrentQuestion?.id, sectionIdValue);
          }
        });
      } else {
        if (timeType == "question") {
          submitAssessment(true, true);
        } else {
          const newCurrentQuestion = sections[sectionIds[0]]?.questions?.[0];
          if(newCurrentQuestion && currentSection.num !== sectionIds?.length)
            updateCurrentQuestion(currentSection.id, newCurrentQuestion);
        }
      }
    }
  }, [sections, currentSection, currentQuestion]);

  const navToQuestion = useCallback(
    (sectionId: string, questionNum: number) => {
      const newQuestionsList = sections[sectionId]?.questions;
      const newCurrentQuestion = newQuestionsList?.[questionNum - 1];
      if (newCurrentQuestion) {
        setCurrentSection({
          id: sectionId,
          num: sectionIds?.findIndex?.((id) => id === sectionId) + 1,
        });

        updateCurrentQuestion(sectionId, newCurrentQuestion);
      } else {
        updateCurrentQuestion(sectionId, newQuestionsList?.[0]);
      }
    },
    [sections, currentQuestion, sectionIds]
  );



  const defaultApiData = useMemo(
    () => ({
      userId,
      ...(labId && { labId }),
      assessmentId,
    }),
    [currentQuestion]
  );

  const flagApiSend = useCallback(async () => {
    await postData(apiList.assessment.saveFlag, {
      ...defaultApiData,
      questionId: currentQuestion.id,
      questionFlagged: currentQuestion?.flagged ? false : true,
    })
      .then(() => {})
      .catch(() => {})
      .finally(() => {});
  }, [currentQuestion, selectedOptions]);

  const confirmMCSolution = useCallback(async () => {
    setIfSubmittingSolution(true);

    await postData(apiList.assessment.saveSolution, {
      ...defaultApiData,
      questionId: currentQuestion.id,
      assessmentStatus: "pending",
      optionId: selectedOptions[currentQuestion.id],
    })
      .then(() => {
        setAnsweredQuestions((aq) => ({
          ...aq,
          [currentQuestion.id]: true,
        }));
        timeType !== "question" && navNextQuestion();
      })
      .catch(() => {})
      .finally(() => {
        setIfSubmittingSolution(false);
      });
  }, [currentQuestion, selectedOptions]);

  const confirmCDSolution = useCallback(async () => {
    setIfSubmittingSolution(true);

    await postData(apiList.assessment.saveSolution, {
      ...defaultApiData,
      questionId: currentQuestion.id,
      assessmentStatus: "InProgress",
      solution: window.btoa(codeSolutions?.[currentQuestion.id]?.solution),
      languageId: codeSolutions?.[currentQuestion.id]?.languageId,
    })
      .then(() => {
        setAnsweredQuestions((aq) => ({
          ...aq,
          [currentQuestion.id]: true,
        }));
        let tempSectionData = [...allSectionQuestionArray];<u></u>
        tempSectionData[currentSection.num - 1][currentQuestion.num - 1].codemsg = codeSolutions?.[currentQuestion.id]?.solution;
        setAllSectionQuestionArray(tempSectionData);
        timeType !== "question" && navNextQuestion();
      })
      .catch(() => {})
      .finally(() => {
        setIfSubmittingSolution(false);
      });
  }, [currentQuestion, codeSolutions]);

  const confirmDESCSolution = useCallback(async () => {
    setIfSubmittingSolution(true);

    await postData(apiList.assessment.saveSolution, {
      ...defaultApiData,
      questionId: currentQuestion.id,
      assessmentStatus: "pending",
      solution: descriptiveAnswers[currentQuestion.id],
    })
      .then(() => {
        setAnsweredQuestions((aq) => ({
          ...aq,
          [currentQuestion.id]: true,
        }));
        timeType !== "question" && navNextQuestion();
      })
      .catch(() => {})
      .finally(() => {
        setIfSubmittingSolution(false);
      });
  }, [currentQuestion, descriptiveAnswers]);

  const confirmSolution = useCallback(() => {
    if (currentQuestion.isCodingType) {
      confirmCDSolution();
    } else if (currentQuestion.type === "DESC") {
      confirmDESCSolution();
    } else {
      confirmMCSolution();
    }
  }, [
    currentQuestion,
    codeSolutions,
    selectedOptions,
    startTime,
    timeLimit,
    descriptiveAnswers,
  ]);

  const runCode = useCallback(
    async (inputVal, cb) => {
      setIfRunningCode(true);
      await postData(apiList.assessment.executeCode, {
        questionId: currentQuestion.id,
        languageId: codeSolutions?.[currentQuestion.id]?.languageId,
        solution: window.btoa(codeSolutions?.[currentQuestion.id]?.solution),
        inputVal: inputVal || "",
      })
        .then((data) => {
          setOutput(
            data && data.submissions
              ? data.submissions[0].stdout
                ? data.submissions[0].stdout
                : data.submissions[0].stderr
                ? window.atob(data.submissions[0].stderr)
                : data.submissions[0].compile_output
              : "ERROR"
          );
          cb();
        })
        .catch(() => {})
        .finally(() => {
          setIfRunningCode(false);
        });
    },
    [codeSolutions, currentQuestionData, currentQuestion]
  );

  function closePage() {
    const origin = qs.parse(window.location.search)?.origin?.toString();
    history.push({
      pathname: "/completedtest",
      search:
        origin || isMockAssessment
          ? `?isMock=${true}&learningPathIndex=${learningPathIndex}`
          : "",
      state: {
        isFromPrepare: isFromPrepare,
        isHackathon: isHackathon,
        hackathonId: hackathonId,
        courseId: courseId,
        prepCourseId: prepCourseId,
        prepCourseName: prepCourseName,
        prepCoursePer: prepCoursePer,
        prepPracCompletionCriteria: prepPracCompletionCriteria,
        prepPracResId: prepPracResId,
        prepPracModId: prepPracModId,
      },
    });
  }

  const startGrading = useCallback(
    async (errorCount = 0) => {
      if (!assessmentData?.showResultOnFinish || errorCount > 3) {
        closePage();
      } else {
        setIfGradingOnProcess(true);

        setTimeout(() => {
          setIfGradingOnProcess(false);
          closePage();
        }, 60000);

        await getData(
          apiList.assessment.getStatus(apiRequestId, assessmentId, labId)
        )
          .then((data) => {
            if (data?.status === "Completed") {
              setIfGradingOnProcess(false);
              closePage();
            } else {
              setTimeout(() => {
                startGrading();
              }, 3000);
            }
          })
          .catch(() => {
            startGrading((errorCount || 0) + 1);
          });
      }
    },
    [assessmentData, apiRequestId, assessmentId, labId]
  );

  function updateOnlineStatus() {
    if (navigator.onLine) {
      toast(
        <>
          <Info />
          &nbsp;&nbsp;
          <span>Back online</span>
        </>,
        {
          autoClose: 2000,
          className: styles.backOnline,
          hideProgressBar: true,
          position: "bottom-center",
          type: "info",
        }
      );

      setIfOnline(true);
    } else {
      setIfOnline(false);
    }
  }

  function issueLastFewMinsWarning(txt:string) {
    toast(
      <>
        <Info />
        &nbsp;&nbsp;
        <span>{`Hurry up! Only ${txt} left`}</span>
      </>,
      {
        autoClose: 4000,
        className: styles.lastFewMinsWarning,
        hideProgressBar: true,
        position: "top-center",
        type: "warning",
      }
    );
  }

  async function startAssessment() {
    await postData(apiList.assessment.saveAssessmentStatus, {
      ...defaultApiData,
      assessmentStatus: "started",
      prepareSubmission: localStorage.getItem("AssessmentFromPrepare")
        ? true
        : false,
      userName: sessionStorage.getItem("user_name"),
    })
      .then((data) => {
        setStartTime(new Date());
        setApiRequestId(data?.requestObjectId);
      })
      .catch((e) => {});
  }

  async function submitAssessment(
    timeOut: boolean,
    autoSubmitted: boolean,
    fromError: boolean = false
  ) {
    setIfSubmittingTest(true);
    if (isHackathon) {
      await postData(apiList.assessment.saveAssessmentStatus, {
        ...defaultApiData,
        assessmentStatus: timeOut ? "timeOut" : "Complete",
        userName: sessionStorage.getItem("user_name"),
        hackathonSubmission: isHackathon,
        ...(autoSubmitted && { autoSubmitFlag: true }),
        hackathonId: hackathonId,
      })
        .then(() => {
          closePage();
        })
        .catch(() => {
          setIfSubmittingTest(false);

          if (!fromError) {
            submitAssessment(timeOut, autoSubmitted, true);
          }
        });
    } else {
      await postData(apiList.assessment.saveAssessmentStatus, {
        ...defaultApiData,
        assessmentStatus: timeOut ? "timeOut" : "Complete",
        userName: sessionStorage.getItem("user_name"),
        hackathonSubmission: isHackathon,
        ...(autoSubmitted && { autoSubmitFlag: true }),
      })
        .then(() => {
          closePage();
        })
        .catch(() => {
          setIfSubmittingTest(false);

          if (!fromError) {
            submitAssessment(timeOut, autoSubmitted, true);
          }
        });
    }
  }

  const clearSelectionApi = useCallback(async (questionId) => {
    await postData(apiList.assessment.clearSelection, {
      ...defaultApiData,
      questionId: questionId,
    })
      .then(() => {})
      .catch(() => {})
      .finally(() => {});
  }, []);

  async function saveUserNavigateCount(navigatedCount: any) {
    await postData(apiList.assessment.saveUserNavigateCount, {
      userId: userId,
      assessmentId: assessmentId,
      navigatedCount: navigatedCount,
    })
      .then(() => {})
      .catch(() => {});
  }

  async function reportProblem(id: string, msg: string) {
    await postData(apiList.assessment.reportProblem, {
      ...defaultApiData,
      questionId: id,
      problem: msg,
      CreatedDate: new Date(),
    })
      .then(() => {
        toast(
          <>
            <Info />
            &nbsp;&nbsp;
            <span>Problem reported</span>
          </>,
          {
            autoClose: 2000,
            className: styles.lastFewMinsWarning,
            hideProgressBar: true,
            position: "top-center",
            type: "warning",
          }
        );
      })
      .catch(() => {});
  }

  function backToAssessment() {
    window.location.href = `/assessments?customer=${customer}&activePage=${isActivePage}&activeTab=${isActiveTab}`;
  }

  function clearSelection(questionId: string) {
    setAnsweredQuestions((aq) => ({
      ...aq,
      [currentQuestion.id]: false,
    }));
    updateSelectedOptions((so) => {
      return {
        ...so,
        [questionId]: [],
      };
    });
    clearSelectionApi(questionId);
  }

  function setSelectedOption(questionId: string, option: string) {
    updateSelectedOptions((so) => {
      return {
        ...so,
        [questionId]: [option],
      };
    });
  }

  function setSelectedOptions(
    questionId: string,
    option: string,
    remove: boolean
  ) {
    updateSelectedOptions((so) => {
      return {
        ...so,
        [questionId]: remove
          ? [
              ...(so?.[questionId]?.filter?.((opt: string) => opt !== option) ||
                []),
            ]
          : [...(so?.[questionId] || []), option],
      };
    });
  }

  function detectDevTools() {}

  function getFullscreenElement() {
    return (
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc
    );
  }

  function isFullscreenEnabled() {
    return (
      doc.fullscreenEnabled ||
      doc.webkitFullscreenEnabled ||
      doc.mozFullScreenEnabled ||
      doc.msFullscreenEnabled
    );
  }

  // const isAdmin = "false";  // Adjust this as necessary
  // const doc = document;
  // const docElem = document.documentElement;

  // if (isAdmin === "false") {
  //   if (
  //     (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement)
  //   ) {
  //     if (docElem.requestFullscreen) {
  //       docElem.requestFullscreen();
  //     } else if (docElem.mozRequestFullScreen) {
  //       docElem.mozRequestFullScreen({ navigationUI: "hide" }).catch(() => {});
  //     } else if (docElem.webkitRequestFullscreen) {
  //       docElem.webkitRequestFullscreen();
  //     } else if (docElem.msRequestFullscreen) {
  //       docElem.msRequestFullscreen();
  //     }
  //   }

  function goToFullScreen() {
    try {
      if (isAdmin === "false") {
        if (
          (doc?.fullScreenElement !== undefined &&
            doc?.fullScreenElement === null) ||
          (doc?.msFullscreenElement !== undefined &&
            doc?.msFullscreenElement === null) ||
          (doc?.mozFullScreen !== undefined && !doc?.mozFullScreen) ||
          (doc?.webkitIsFullScreen !== undefined && !doc?.webkitIsFullScreen)
        ) {
          if (docElem?.requestFullScreen) {
            docElem?.requestFullScreen();
          } else if (docElem?.mozRequestFullScreen) {
            docElem
              ?.mozRequestFullScreen({
                navigationUI: "hide",
              })
              .catch(() => {});
          } else if (docElem?.webkitRequestFullScreen) {
            docElem?.webkitRequestFullScreen();
          } else if (docElem?.msRequestFullscreen) {
            docElem?.msRequestFullscreen();
          }
        }
      }
      if (isAdmin === "false") {
        setIfInFullScreenMode(true);
      }
    } catch (e) {}
  }

  function restrictFnKeys(e: KeyboardEvent) {
    if (
      e.key == "F11" ||
      e.key == "F12" ||
      e.key == "Meta" ||
      e.keyCode == 27
    ) {
      restrictAction(e);
      goToFullScreen();
    }
  }

  const handleRestrictedAction = () => {
    if (
      !loadingTest &&
      assessmentData &&
      (proctor.server ? proctor.hasAccess : true) &&
      isAdmin === "false"
    ) {
      setRestrictedActionCount((pc) => pc + 1);
    }
  };
  const restrictAction = (e: any) => {
    if (isAdmin === "false") {
      if (checkRestrictValue?.current && allowedRestrictedActionsCount > 1) {
        setRestrictedActionCount((pc) => pc + 1);
      }
      handleRestrictedAction();
    }
    e.preventDefault();
  };

  const restrictActionOnly = (e: any) => {
    e?.preventDefault?.();
  };

  const handleFullscreenChange = useCallback(
    (e: any) => {
      e?.preventDefault?.();

      if (
        inFullScreenMode &&
        !loadingTest &&
        (proctor.server ? proctor.hasAccess : true) &&
        isAdmin === "false"
      ) {
        setRestrictedActionCount((pc) => pc + 1);
      }
      if (isAdmin === "false") {
        setIfInFullScreenMode(!inFullScreenMode);
        goToFullScreen();
      }
    },
    [loadingTest, proctor, inFullScreenMode]
  );

  function handleVisibilityChange() {
    if(document.hidden && isAdmin === "false") {
      setRestrictedActionCount((pc) => pc + 1);
    }
  }

  const initializeTest = useCallback(
    (dataParam: any = undefined, codingLanguages: TStateCodeLanguages) => {
      setTimerStart(true);
      const data: any = dataParam || assessmentData;
      const sectionsData: { [key: string]: TStateSectionData } = {};
      const initialSectionId = data?.section?.[0];

      document.addEventListener("contextmenu", restrictActionOnly, false);
      document.addEventListener("copy", restrictAction, false);
      document.addEventListener("cut", restrictAction, false);
      document.addEventListener("drag", restrictActionOnly, false);
      document.addEventListener("drop", restrictActionOnly, false);
      document.addEventListener(
        "fullscreenchange",
        handleFullscreenChange,
        false
      );
      document.addEventListener("fullscreenerror", restrictAction, false);
      document.addEventListener("keydown", restrictFnKeys, false);
      document.addEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
        false
      );
      document.addEventListener(
        "MSFullscreenChange",
        handleFullscreenChange,
        false
      );
      document.addEventListener("paste", restrictAction, false);
      document.addEventListener("resize", restrictAction, false);
      document.addEventListener("select", restrictActionOnly, false);
      // document.addEventListener("visibilitychange", restrictAction, false);
      document.addEventListener("visibilitychange", handleVisibilityChange, false);
      document.addEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
        false
      );

      data?.section?.forEach((section: string) => {
        sectionsData[section] = data?.[section];
      });

      setCurrentSection({
        id: initialSectionId,
        num: 1,
      });
      setSectionIds(Object.keys(sectionsData));
      setCurrentSectionQuestionIds(
        sectionsData?.[data?.section?.[0]]?.questions?.map(({ id }) => id) || []
      );
      setSections(sectionsData);
      setTimeLimit(data?.assessmentTimeLimit * 60);
      setPreviousTimerValue(data?.PreviousTimerValue + 1);
      setTitle(data?.title);
      setTimeType(data?.timeType);
      setTotalTime(
        data?.remainingTimerValue == 0
          ? data?.assessmentTimeLimit * 60
          : data?.remainingTimerValue * 60
      );
      setLastQuestion(data?.latestQuestionId);
      setLastSectionId(data?.latestSectionId);

      const defaultAnsweredQuestions: { [key: string]: boolean } = {};
      const defaultFlaggedQuestions: { [key: string]: boolean } = {};
      const defaultReportedQuestions: { [key: string]: boolean } = {};
      const defaultReportedMsgQuestions: { [key: string]: any } = {};
      const defaultTimeLimitForQuestion: { [key: string]: number } = {};
      const defaultSelectedOptions: TStateSelectedOptions = {};
      const defaultCodeSolutions: TStateCodeSolutions = {};
      const defaultDescSolutions: TStateDescriptiveAnswers = {};

      Object.values(sectionsData)?.forEach?.((section) => {
        section?.questions?.forEach((question) => {
          if (
            question.type === "CD" &&
            (question?.savedCodeSolution || question?.questionFlagged)
          ) {
            const index = codingLanguages.findIndex(
              (x) => x.id === question?.selectedLanguageId
            );
            defaultAnsweredQuestions[question.id] = question?.savedCodeSolution
              ? true
              : false;
            defaultFlaggedQuestions[question.id] = question?.questionFlagged
              ? true
              : false;
            defaultReportedQuestions[question.id] = question?.report
              ? true
              : false;
            defaultReportedMsgQuestions[question.id] = question?.reportmsg;
            defaultTimeLimitForQuestion[question.id] = question?.timeLimit;
            defaultCodeSolutions[question.id] = {
              languageId: question?.selectedLanguageId
                ? question?.selectedLanguageId
                : codingLanguages?.[0]?.id || codeLanguages?.[0]?.id,
              languageName: question?.selectedLanguageId
                ? codingLanguages?.[index]?.languageName ||
                  codeLanguages?.[index]?.languageName
                : codingLanguages?.[0]?.languageName ||
                  codeLanguages?.[0]?.languageName,
              solution: question?.savedCodeSolution
                ? window.atob(question?.savedCodeSolution)
                : "",
            };
          } else if (
            question.type === "MC" &&
            (question?.selectedOptionId || question?.questionFlagged)
          ) {
            defaultAnsweredQuestions[question.id] = question?.selectedOptionId
              ?.length
              ? true
              : false;
            defaultFlaggedQuestions[question.id] = question?.questionFlagged
              ? true
              : false;
            defaultReportedQuestions[question.id] = question?.report
              ? true
              : false;
            defaultReportedMsgQuestions[question.id] = question?.reportmsg;
            defaultTimeLimitForQuestion[question.id] = question?.timeLimit;
            defaultSelectedOptions[question.id] = [
              ...(question?.selectedOptionId || []),
            ];
          } else if (
            (question.type === "DESC" && question?.savedCodeSolution) ||
            question?.questionFlagged
          ) {
            defaultAnsweredQuestions[question.id] = question?.savedCodeSolution
              ? true
              : false;
            defaultFlaggedQuestions[question.id] = question?.questionFlagged
              ? true
              : false;
            defaultReportedQuestions[question.id] = question?.report
              ? true
              : false;
            defaultReportedMsgQuestions[question.id] = question?.reportmsg;
            defaultTimeLimitForQuestion[question.id] = question?.timeLimit;
            defaultDescSolutions[question.id] = question?.savedCodeSolution;
          }
        });
      });
      setAnsweredQuestions(defaultAnsweredQuestions);
      setFlaggedQuestions(defaultFlaggedQuestions);
      setReportedQuestions(defaultReportedQuestions);
      setReportedMsgQuestions(defaultReportedMsgQuestions);
      setTimeLimitQuestions(defaultTimeLimitForQuestion);
      updateSelectedOptions(defaultSelectedOptions);
      updateCodeSolutions(defaultCodeSolutions);
      setDescriptiveAnswers(defaultDescSolutions);

      if (isAdmin === "false") {
        startAssessment();
      }
      setProctorAi(true);
      setProctor({
        hasAccess: true,
        room: data?.proctoringRoom,
        server: data?.proctoringServer,
      });
    },
    [assessmentData, codeLanguages]
  );

  useEffect(() => {
    if (checkRestrict && allowedRestrictedActionsCount > 1) {
      if (restrictedActionCount >= allowedRestrictedActionsCount) {
        submitAssessment(false, true);
      } else if (!loadingTest && restrictedActionCount) {
        saveUserNavigateCount(restrictedActionCount);
        if (!restrictedActionToast.current) {
          restrictedActionToast.current = toast(
            <span>
              Restricted Action {restrictedActionCount}/
              {allowedRestrictedActionsCount}
            </span>,
            {
              autoClose: 2000,
              className: styles.restrictedAction,
              hideProgressBar: true,
              position: "bottom-left",
              transition: Slide,
              onClose() {
                restrictedActionToast.current = null;
              },
              type: "error",
            }
          );
        } else {
          saveUserNavigateCount(restrictedActionCount);
          toast.update(restrictedActionToast.current, {
            render: (
              <span>
                Restricted Action {restrictedActionCount}/
                {allowedRestrictedActionsCount}
              </span>
            ),
            autoClose: 2000,
            className: styles.restrictedAction,
            hideProgressBar: true,
            position: "bottom-left",
            transition: Slide,
            type: "error",
          });
        }
      }
    }
  }, [restrictedActionCount, allowedRestrictedActionsCount]);

  useEffect(() => {
    async function getAssessmentData() {
      setIfLoadingTest(true);

      const codingLanguages = await getData(
        apiList.assessment.getCodeLanguages(assessmentId)
      )
        .then((data: TStateCodeLanguages) => {
          setCodeLanguages(data);

          return data;
        })
        .catch(() => {});

      await getData(apiList.assessment.getData(assessmentId, labId))
        .then((data: any) => {
          setIfTestIsLoaded(true);
          setCheckRestrict(data?.noNavigation);
          setCheckAllQuestions(data?.allQuestions);
          setAiProctoring(data?.proctoringAI);
          checkRestrictValue.current = data?.noNavigation;
          setAllowedRestrictedActionsCount(data?.allowedExitAttempts);
          setAssessmentData(data);
          setRestrictedActionCount(data.navigatedCount);
          if (data?.proctoringServer) {
            setProctor({
              hasAccess: false,
              room: data?.proctoringRoom,
              server: data?.proctoringServer,
            });
          } else if (data?.proctoringAI) {
            setProctorAi(false);
          } else {
            initializeTest(data, codingLanguages || []);
          }
        })
        .catch(() => {});
    }
    getAssessmentData();
  }, []);
  useEffect(() => {
    const head = document.getElementsByTagName("head")[0];
    const viewportMeta = document.createElement("meta");
    viewportMeta.setAttribute(
      "content",
      "width=device-width, initial-scale=1, viewport-fit=cover"
    );
    viewportMeta.setAttribute("name", "viewport");
    const themeMeta = document.createElement("meta");
    themeMeta.setAttribute("content", "#2A153D");
    themeMeta.setAttribute("name", "theme-color");
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    head.appendChild(themeMeta);
    head.appendChild(viewportMeta);

    goToFullScreen();
    detectDevTools();
    getCustomerLogo();
    const fullScreenCheckInterval = setInterval(() => {
      goToFullScreen();
    }, 2000);
    return () => {
      clearInterval(fullScreenCheckInterval);
      document.removeEventListener("contextmenu", restrictActionOnly);
      document.removeEventListener("copy", restrictAction);
      document.removeEventListener("cut", restrictAction);
      document.removeEventListener("drag", restrictActionOnly);
      document.removeEventListener("drop", restrictActionOnly);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("fullscreenerror", restrictAction);
      document.removeEventListener("keydown", restrictFnKeys);
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
      document.removeEventListener("paste", restrictAction);
      document.removeEventListener("resize", restrictAction);
      document.removeEventListener("select", restrictActionOnly);
      document.removeEventListener("visibilitychange", restrictAction);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      head.removeChild(themeMeta);
      head.removeChild(viewportMeta);
    };
  }, []);

  useEffect(() => {
    const newCurrentQuestion = sections[currentSection.id]?.questions?.[0];

    updateCurrentQuestion(currentSection.id, newCurrentQuestion);
    setCurrentSectionQuestionIds(
      sections[currentSection.id]?.questions?.map(({ id }) => id) || []
    );
    // setCurrentFlagQuestionIds(sections[currentSection.id]?.questions?.map(({ flag }) => (id)) || []);
  }, [sections, currentSection]);

  useEffect(() => {
    updateCurrentQuestion(
      currentSection.id,
      sections[currentSection.id]?.questions?.[currentQuestion.num - 1]
    );
  }, [currentSection, flaggedQuestions, reportedQuestions]);

  useEffect(() => {
    setCurrentTab("question");
  }, [currentQuestion]);

  useEffect(() => {
    if (proctor.server && !proctor.hasAccess && isAdmin === "true") {
      initializeTest(undefined, codeLanguages || []);
    }
  });

  const MINUTE_MS = 60000;
  var counter = previousTimerValue;
  var increment = function () {
    let timerValue = counter++;
    timeUpdate(timerValue);
  };

  useEffect(() => {
    if(userPrivileges?.isStudent) {
      if (timeLimit > 0 && totalTime !== 40000) {
        const interval = setInterval(() => {
          increment();
        }, MINUTE_MS);
        return () => clearInterval(interval);
      }
    }
  }, [timeLimit, totalTime]);

  const timeUpdate = async (timerValue: number) => {
    if (labId) {
      await postData(apiList.assessment.saveAssessmentTimer, {
        userId: userId,
        assessmentId: assessmentId,
        timerValue: timerValue,
        labId: labId,
      })
        .catch((e) => {})
        .finally(() => {});
    } else {
      await postData(apiList.assessment.saveAssessmentTimer, {
        userId: userId,
        assessmentId: assessmentId,
        timerValue: timerValue,
      })
        .catch((e) => {})
        .finally(() => {});
    }
  };
  return (
    <>
      <ThemeProvider theme={theme}>
        {loadingTest && isAdmin === "false" ? (
          <Loader
            testIsLoaded={testIsLoaded}
            setIfLoadingTest={setIfLoadingTest}
            customerLogo={customerLogo}
          />
        ) : proctor.server && !proctor.hasAccess && isAdmin === "false" ? (
          <div>
            <ProctorDetector
              startTest={() => {
                initializeTest(undefined, codeLanguages || []);
              }}
            />
          </div>
        ) : aiProctoring && !proctor.hasAccess ? (
          <div>
            <ProctorAiDetector
              startTest={() => {
                initializeTest(undefined, codeLanguages || []);
              }}
            />
          </div>
        ) : (
          // (proctor.server && !proctor.hasAccess && isAdmin === "false")
          // ? (
          //   <div>
          //   {/* <ProctorDetector
          //     startTest={() => {
          //       initializeTest(undefined, codeLanguages || []);
          //     }}
          //   /> */}
          //    <ProctorAiDetector
              //   startTest={() => {
              // initializeTest(undefined, codeLanguages || []);
              //   }}
          //   />
          //   </div>
          // )
          assessmentData && (
            <div
              className={cn(
                styles.page,
                lightMode ? styles.lightTheme : styles.darkTheme,
                {
                  "large-screen": largeScreen,
                  "medium-screen": mediumScreen,
                  "small-screen": smallScreen,
                }
              )}
            >
              {proctor.server && proctor.hasAccess && isAdmin === "false" && (
                <JitsiProctoring
                  domain={proctor.server}
                  roomName={proctor.room}
                />
              )}
              <TestContext.Provider
                value={{ largeScreen, lightMode, mediumScreen, smallScreen }}
              >
                <div
                  className={cn(
                    styles.body,
                    mediumScreen && styles.mediumScreen,
                    currentQuestion.isCodingType &&
                      currentTab === "solution" &&
                      styles.noFreeScroll
                  )}
                >
                  <HeaderFooter
                    confirmSolution={confirmSolution}
                    switchingDisable={timeType == "question"}
                    timeType={timeType}
                    currentQuestion={currentQuestion}
                    currentSection={currentSection}
                    currentSectionAnsweredQuestionIds={
                      currentSectionAnsweredQuestionIds
                    }
                    currentSectionFlaggedQuestionIds={
                      currentSectionFlaggedQuestionIds
                    }
                    checkAllQuestions={checkAllQuestions}
                    currentSectionQuestionIds={currentSectionQuestionIds}
                    currentTab={{
                      tab: currentTab,
                      setTab: setCurrentTab,
                    }}
                    disabled={
                      submittingTest || submittingSolution || runningCode
                    }
                    openSectionDrawer={() => {
                      setSidebarVisibility((v) => !v);
                    }}
                    selectedOption={selectedOptions?.[currentQuestion.id] || []}
                    codeSolution={codeSolutions?.[currentQuestion.id] || {}}
                    descriptiveAnswer={
                      descriptiveAnswers?.[currentQuestion.id] || ""
                    }
                    customInput={customInput}
                    elapsedTime={elapsedTime}
                    isAdmin={isAdmin}
                    backToAssessment={backToAssessment}
                    flagQuestion={flagQuestion}
                    navNextQuestion={navNextQuestion}
                    navPrevQuestion={navPrevQuestion}
                    navToQuestion={navToQuestion}
                    numAnsweredQuestions={numAnsweredQuestions}
                    numFlaggedQuestions={numFlaggedQuestions}
                    numQuestions={numQuestions}
                    output={output}
                    outputIsVisible={outputIsVisible}
                    outputTab={outputTab}
                    runCode={runCode}
                    runningCode={runningCode}
                    sectionIds={sectionIds}
                    setCustomInput={setCustomInput}
                    setIfOutputIsVisible={setIfOutputIsVisible}
                    setOutput={setOutput}
                    setOutputTab={setOutputTab}
                    setCurrentSectionDetails={setCurrentSectionDetails}
                    setCurrentSectionDetailsCB={() => {
                      const newCurrentQuestion =
                        sections[currentSection.id]?.questions?.[0];

                      updateCurrentQuestion(
                        currentSection.id,
                        newCurrentQuestion
                      );
                    }}
                    submitAssessment={() => {
                      setIfTestSummaryIsOpen(true);
                    }}
                    submittingSolution={submittingSolution}
                    title={title}
                    totalTime={totalTime}
                    assessmentLogo={assessmentData?.customerLogo}
                    customerLogo={customerLogo}  
                  />
                  <Content
                    switchingDisable={timeType == "question"}
                    currentSection={currentSection}
                    currentSectionAnsweredQuestionIds={
                      currentSectionAnsweredQuestionIds
                    }
                    currentSectionFlaggedQuestionIds={
                      currentSectionFlaggedQuestionIds
                    }
                    currentSectionReportedQuestionsIds={
                      currentSectionReportedQuestionsIds
                    }
                    currentSectionReportedMsgQuestionsIds={
                      currentSectionReportedMsgQuestionsIds
                    }
                    currentSectionQuestionIds={currentSectionQuestionIds}
                    navToQuestion={navToQuestion}
                    clearSelection={clearSelection}
                    reportProblem={reportQuestion}
                    assessmentId={assessmentId}
                    labId={labId}
                    setReportMessage={(msg: string) => setReportMessage(msg)}
                    setAllSectionQuestionArray={(msg: reportInterface[][]) =>
                      setAllSectionQuestionArray(msg)
                    }
                    allSectionQuestionArray={allSectionQuestionArray}
                    elapsedTime={elapsedTime}
                    totalTime={currentQuestion?.timeLimit ? currentQuestion?.timeLimit * 60 : null}
                    reportMessage={reportMessage}
                    codeEditorIsInLightMode={codeEditorIsInLightMode}
                    codeLanguages={codeLanguages}
                    codeSolution={codeSolutions?.[currentQuestion.id] || {}}
                    confirmSolution={confirmSolution}
                    currentQuestion={currentQuestion}
                    currentQuestionData={currentQuestionData}
                    currentTab={currentTab}
                    customInput={customInput}
                    descriptiveAnswer={
                      descriptiveAnswers?.[currentQuestion.id] || ""
                    }
                    disabled={
                      submittingTest || submittingSolution || runningCode
                    }
                    isAdmin={isAdmin}
                    flagQuestion={flagQuestion}
                    handleRestrictedAction={handleRestrictedAction}
                    navNextQuestion={navNextQuestion}
                    navPrevQuestion={navPrevQuestion}
                    output={output}
                    outputIsVisible={outputIsVisible}
                    outputTab={outputTab}
                    runCode={runCode}
                    runningCode={runningCode}
                    selectedOptions={
                      selectedOptions?.[currentQuestion.id] || []
                    }
                    setCustomInput={setCustomInput}
                    setDescriptiveAnswers={setDescriptiveAnswers}
                    setIfCodeEditorIsInLightMode={setIfCodeEditorIsInLightMode}
                    setIfOutputIsVisible={setIfOutputIsVisible}
                    setOutput={setOutput}
                    setOutputTab={setOutputTab}
                    setSelectedOption={setSelectedOption}
                    setSelectedOptions={setSelectedOptions}
                    submittingSolution={submittingSolution}
                    updateCodeSolutions={updateCodeSolutions}
                  />
                </div>
                <Summary
                  answeredQuestions={answeredQuestions}
                  currentQuestion={currentQuestion}
                  currentSection={currentSection}
                  flaggedQuestions={flaggedQuestions}
                  gradingOnProcess={gradingOnProcess}
                  navToQuestion={navToQuestion}
                  numAnsweredQuestions={numAnsweredQuestions}
                  numFlaggedQuestions={numFlaggedQuestions}
                  numQuestions={numQuestions}
                  open={testSummaryIsOpen}
                  sectionIds={sectionIds}
                  sections={sections}
                  setIfOpen={setIfTestSummaryIsOpen}
                  setSidebarVisibility={setSidebarVisibility}
                  smallScreen={smallScreen}
                  submitAssessment={submitAssessment}
                  submittingTest={submittingTest}
                />
                <SideNav
                  answeredQuestions={answeredQuestions}
                  currentQuestion={currentQuestion}
                  currentSection={currentSection}
                  flaggedQuestions={flaggedQuestions}
                  navToQuestion={navToQuestion}
                  numAnsweredQuestions={numAnsweredQuestions}
                  numFlaggedQuestions={numFlaggedQuestions}
                  numQuestions={numQuestions}
                  open={sidebarIsVisible}
                  sectionIds={sectionIds}
                  sections={sections}
                  setIfOpen={setSidebarVisibility}
                  smallScreen={smallScreen}
                />
              </TestContext.Provider>
            </div>
          )
        )}
        {aiProctoring && (
          <Detection
            assessmentId={assessmentId}
            userId={userId}
            loadingTest={loadingTest}
            timerStart={timerStart}
            elapsedTime={elapsedTime}
          />
        )}
        {/* !online && (
          <Box
            style={{
              backgroundColor: "#fffc",
            }}
            sx={{
              alignItems: "center",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "center",
              position: "absolute",
              width: "100%",
              zIndex: 1000,
            }}
          >
            {/* <Box
              style={{
                backgroundColor: "#fff",
              }}
              sx={{
                boxShadow: "rgba(0,0,0,0.1) 0 0 10px 1px",
                alignItems: "center",
                borderRadius: 8,
                display: "flex",
                flexDirection: "column",
                height: "200px",
                justifyContent: "center",
                position: "relative",
                width: "200px",
              }}
            >
              <SignalWifiOffIcon
                style={{
                  color: "#ff0000",
                  fontSize: 80,
                  marginBottom: 20,
                }}
              />
              <Typography variant="h5">No Internet</Typography>
            </Box> 
          </Box>
        )} */}
      </ThemeProvider>
      <ToastContainer />
    </>
  );
}
