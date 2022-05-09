import { Server } from "socket.io"
import { Ack } from "../interfaces/ack"
import { Poll } from "../interfaces/poll"
import { CHANNELS } from "../protocol/channels"
import { CLIENT_EVENTS } from "../protocol/events"
import Provider from "../provider"
import Logger from "../utils/logger"

const POLL_EVENTS = {
    SET_CLIENT_CHOICE: 'SET_CLIENT_CHOICE',
    VIEWER_CHOICE: 'VIEWER_CHOICE',
    SEND_POLL: 'SEND_POLL',
}

const informVote = (io: Server, ticket: string, optionIndex: number) => {
    io.to(CHANNELS.SM_ROOM).emit(POLL_EVENTS.SET_CLIENT_CHOICE, {ticket, optionIndex});
}

const informPoll = (io: Server, recepient: string, poll: Poll) => {
    io.to(recepient).emit(POLL_EVENTS.SEND_POLL, poll.getJSON());
}

const sendPollToSocket = (socket, poll: Poll) => {
    socket.emit(POLL_EVENTS.SEND_POLL, poll.getJSON());
}

export const registerPollHandlers = (io: Server, socket) => {
    const createPoll = (newPoll: Poll, callback) => {
        const poll: Poll = Provider.getPoll();
        poll.voters = new Map<string, number>();
        poll.setPoll(newPoll.question, newPoll.options);
        callback(new Ack('info', 'New Poll created', JSON.stringify(poll.getJSON())).getJSON());
    }

    const sendPoll = () => {
        const poll: Poll = Provider.getPoll();
        sendPollToSocket(socket, poll);
        Logger.info(`Poll has been sent.`);
    }

    const updatePoll = ({question, options}, callback) => {
        const poll: Poll = Provider.getPoll();
        poll.setPoll(question, options).then(isSuccess => {
            if (!isSuccess) {
                callback(new Ack('error', 'No more updates to poll allowed', 'Poll has started'));
                return;
            }
            informPoll(io, CHANNELS.SM_ROOM, poll);
            Logger.info(`Poll has been updated.`);
            callback(new Ack('success', 'Poll updated'));
        });
    }

    const togglePollStartStop = ({isActive}, callback) => {
        const poll: Poll = Provider.getPoll();
        poll.isActive = isActive;
        informPoll(io, CHANNELS.SM_ROOM, Provider.getPoll());
        informPoll(io, CHANNELS.MAIN_ROOM, Provider.getPoll());
        callback(new Ack('success', 'Poll started'));
    }

    const recvVote = ({ticket, optionIndex}, callback) => {
        const poll: Poll = Provider.getPoll();
        const updatedOption = poll.voteOption(optionIndex, ticket);
        if (!updatedOption) {
            callback(new Ack('error', 'You have already submitted, or the option is deleted.').getJSON());
            return;
        }
        informVote(io, ticket, optionIndex);
        callback(new Ack('success', `Your vote for ${updatedOption.label} has been received.`));
    }

    socket.on(CLIENT_EVENTS.SEND_CLIENT_CHOICE, recvVote);
    socket.on(CLIENT_EVENTS.TOGGLE_POLL_START, togglePollStartStop)
    socket.on(CLIENT_EVENTS.UPDATE_POLL, updatePoll);
    socket.on(CLIENT_EVENTS.LOAD_POLL, sendPoll);
    socket.on(CLIENT_EVENTS.CREATE_POLL, createPoll);
}