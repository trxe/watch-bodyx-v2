import { Server } from "socket.io"
import { Ack } from "../interfaces/ack"
import { Client } from "../interfaces/client"
import { Poll } from "../interfaces/poll"
import { CHANNELS } from "../protocol/channels"
import { CLIENT_EVENTS } from "../protocol/events"
import Provider from "../provider"
import Logger from "../utils/logger"

const POLL_EVENTS = {
    SET_CLIENT_CHOICE: 'SET_CLIENT_CHOICE',
    VIEWER_CHOICE: 'VIEWER_CHOICE',
    SEND_POLL: 'SEND_POLL',
    POLL_STATUS: 'POLL_STATUS',
}

const informVote = (io: Server, votes: number, ticket: string, optionIndex: number) => {
    io.to(CHANNELS.SM_ROOM).emit(POLL_EVENTS.SET_CLIENT_CHOICE, {ticket, optionIndex, votes});
}

const informPoll = (io: Server, recepient: string, poll: Poll) => {
    io.to(recepient).emit(POLL_EVENTS.SEND_POLL, poll.getJSON());
}

const sendPollToSocket = (socket, poll: Poll) => {
    socket.emit(POLL_EVENTS.SEND_POLL, poll.getJSON());
}

export const registerPollHandlers = (io: Server, socket) => {
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
        Logger.info(`Poll is now ${isActive ? 'active' : 'inactive'}`);
        informPoll(io, CHANNELS.SM_ROOM, Provider.getPoll());
        informPoll(io, CHANNELS.MAIN_ROOM, Provider.getPoll());
        callback(new Ack('success', 'Poll started'));
    }

    const checkVote = ({ticket}, callback) => {
        const poll: Poll = Provider.getPoll();
        console.log('pollHandler.ts', poll.voters)
        if (!poll.voters || !poll.voters.has(ticket)) {
            callback(new Ack('warning', 'Vote not available'));
            return;
        }
        const optionIndex = poll.voters.get(ticket);
        callback(new Ack('success', 'Voted', JSON.stringify(optionIndex)).getJSON());
    }

    const recvVote = ({ticket, optionIndex}, callback) => {
        const poll: Poll = Provider.getPoll();
        const client: Client = Provider.getClientByTicket(ticket);
        if (!client) {
            callback(new Ack('error', 'You are not a registered attendee of this show.').getJSON());
            return;
        }
        Logger.info(`User ${client.user.name} (ticket ${ticket}) has voted for option ${optionIndex}`);
        poll.voteOption(optionIndex, ticket)
            .then(updatedOption => {
                if (!updatedOption) {
                    callback(new Ack('error', 'You have already submitted, or the option is deleted.').getJSON());
                    return;
                }
                informVote(io, updatedOption.votes, ticket, optionIndex);
                callback(new Ack('success', `Your vote for ${updatedOption.label} has been received.`));
            });
    }

    const resetPoll = (req, callback) => {
        const poll: Poll = Provider.getPoll();
        poll.resetPoll()
            .then(() => {
                console.log(poll);
                informPoll(io, CHANNELS.SM_ROOM, Provider.getPoll());
                informPoll(io, CHANNELS.MAIN_ROOM, Provider.getPoll());
                callback(new Ack('success', 'Successfully reset poll'))
            });
    }

    const publishResults = ({isResults}, callback) => {
        const poll: Poll = Provider.getPoll();
        poll.isResults = isResults;
        Logger.info(`Poll results are now ${isResults ? 'visible' : 'hidden'}`);
        informPoll(io, CHANNELS.SM_ROOM, Provider.getPoll());
        informPoll(io, CHANNELS.MAIN_ROOM, Provider.getPoll());
        callback(new Ack('success', 'Published results'))
    }

    socket.on(CLIENT_EVENTS.SEND_CLIENT_CHOICE, recvVote);
    socket.on(CLIENT_EVENTS.CHECK_VOTE, checkVote);
    socket.on(CLIENT_EVENTS.ADMIN_TOGGLE_POLL_STATUS, togglePollStartStop)
    socket.on(CLIENT_EVENTS.ADMIN_PUBLISH_POLL_RESULTS, publishResults)
    socket.on(CLIENT_EVENTS.CREATE_POLL, resetPoll);
    socket.on(CLIENT_EVENTS.UPDATE_POLL, updatePoll);
    socket.on(CLIENT_EVENTS.LOAD_POLL, sendPoll);
}