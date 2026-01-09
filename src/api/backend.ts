import { getFastAPI } from "./generated";

const api = getFastAPI();

export const getTemplateGraphs = api.getTemplateGraphsGraphsTemplatesGet;
export const getTemplateGraph = api.getTemplateGraphDetailsGraphsGraphIdGet;
export const enrollInTemplateGraph = api.enrollInTemplateGraphGraphsGraphIdEnrollmentsPost;
export const getGraphVisualization = api.getGraphVisualizationEndpointGraphsGraphIdVisualizationGet;
export const getPublicGraphContent = api.getPublicGraphContentGraphsGraphIdContentGet;

export const getMyGraphs = api.getMyGraphsMeGraphsGet;
export const createGraph = api.createGraphMeGraphsPost;
export const getMyGraph = api.getMyGraphMeGraphsGraphIdGet;
export const getMyGraphVisualization = api.getMyGraphVisualizationMeGraphsGraphIdVisualizationGet;
export const getMyGraphContent = api.getMyGraphContentMeGraphsGraphIdContentGet;
export const enrollInMyGraph = api.enrollInGraphMeGraphsGraphIdEnrollmentsPost;

export const getNextQuestionForMyGraph = api.getNextQuestionMeGraphsGraphIdNextQuestionGet;
export const getNextQuestionForEnrolledGraph = api.getNextQuestionInEnrolledGraphGraphsGraphIdNextQuestionGet;
export const submitSingleAnswer = api.submitSingleAnswerAnswerPost;

export const backendApi = api;
