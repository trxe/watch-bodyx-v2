import { createContext, useContext, useEffect, useState } from "react";
import EVENTS from "../config/events";
import { useSockets } from "./socket.context";

interface Option {
    label: string
    votes: number
}

interface IVoter {
    ticket: string,
    optionIndex: number
}

class Poll {
    question: string
    options: Array<Option>
    isActive: boolean
    isResults: boolean

    // admins only update the following
    voters: Map<string, number> // user ticket, option label

    constructor(question?: string, options?: Array<Option>) {
        this.question = question;
        this.options = !options ? [] : options;
        this.isActive = false;
        this.isResults = false;
        this.voters = new Map<string, number>();
    }

    public setOptions(options: Array<Option>) {
        this.options = options;
    }

    public setVoters(voterArray) {
        console.log('setting voters', voterArray);
        this.voters = new Map<string, number>();
        voterArray.forEach(voter => {
            console.log("this voter", voter)
            this.voters.set(voter.ticket, voter.optionIndex);
        });
    }

    public addOption(label: string) {
        if (this.isActive || this.isResults) return;
        // if votes are already present, no more changes to the poll options are allowed.
        if (this.voters.size > 0) return;
        const option: Option = {label, votes: 0};
        this.options.push(option);
    }

    public editOption(label: string, atIndex: number) {
        if (this.isActive || this.isResults) return;
        // if votes are already present, no more changes to the poll options are allowed.
        if (this.voters.size > 0) return;
        const option: Option = {label, votes: 0};
        if (atIndex != null && atIndex < this.options.length - 1) {
            this.options = [...this.options.slice(0, atIndex), option, ...this.options.slice(atIndex+1)]
        } else if (atIndex != null && atIndex == this.options.length - 1) {
            this.options = [...this.options.slice(0, atIndex), option]
        }
    }

    public removeOption(atIndex: number) {
        if (this.isActive || this.isResults) return;
        // if votes are already present, no more changes to the poll options are allowed.
        if (this.voters.size > 0) return;
        if (atIndex >= this.options.length || atIndex < 0) return null;
        return this.options.splice(atIndex, 1);
    }

    public voteOption(atIndex: number, votes: number, ticket?: string) {
        if (this.voters.has(ticket)) return;
        if (atIndex >= this.options.length || atIndex < 0) return;
        const option = this.options[atIndex];
        this.options[atIndex] = {...option, votes};
        if (ticket != null) this.voters.set(ticket, atIndex);
    }
}

interface IPollContext {
    poll: Poll
    setPoll: Function
    activeStatus: boolean
    setActiveStatus: Function
    isResults: boolean
    setIsResults: Function
    question: string
    setQuestion: Function
    options: Array<Option>
    setOptions: Function
    isEditPoll: boolean
    setEditPoll: Function
    totalVoters: number
    currentVotes: number
}

const PollContext = createContext<IPollContext>({
    poll: new Poll(),
    setPoll: () => console.log('dummy qn'),
    activeStatus: false,
    setActiveStatus: () => console.log('dummy status'),
    isResults: false,
    setIsResults: () => console.log('dummy isResults'),
    question: null,
    setQuestion: () => console.log('dummy qn'),
    options: [],
    setOptions: () => console.log('dummy log'),
    isEditPoll: true,
    setEditPoll: () => console.log('dummy toggle editing'),
    totalVoters: 0,
    currentVotes: 0
});

const PollProvider = (props: any) => {
    const [poll, setPoll] = useState(new Poll());
    const [activeStatus, setActiveStatus] = useState(false);
    const [currentVotes, setCurrentVotes] = useState(0);
    const [totalVoters, setTotalVoters] = useState(0);
    const [question, setQuestion] = useState(poll.question);
    const [options, setOptions] = useState(poll.options);
    const [isResults, setIsResults] = useState(false);
    const [isEditPoll, setEditPoll] = useState(false);
    const {socket, setNotif, show} = useSockets();

    const [isFirstLoad, setFirstLoad] = useState(true);

    // starting the poll
    useEffect(() => {
        if (!isFirstLoad || !socket || !show.attendees) return;
        socket.emit(EVENTS.CLIENT.LOAD_POLL);
        setTotalVoters(show.attendees.size);
        setFirstLoad(true);
    }, [socket, show]);

    if (socket != null) {
        socket.off(EVENTS.SERVER.SEND_POLL)
            .on(EVENTS.SERVER.SEND_POLL, (res) => {
                const {question, options, isActive, isResults, voters} = res;
                poll.question = question;
                setQuestion(poll.question);
                if (options != null) poll.setOptions(options);
                setOptions(poll.options);
                if (voters != null) poll.setVoters(voters);
                setCurrentVotes(poll.voters.size);
                if (isActive != null) poll.isActive = isActive;
                setActiveStatus(isActive);
                if (isResults != null) poll.isResults = isResults;
                setIsResults(isResults);
                if (isActive || isResults) location.hash = '#poll';
                console.log('poll', poll);
                setPoll(poll);
            });

        socket.off(EVENTS.SERVER.SET_CLIENT_CHOICE)
            .on(EVENTS.SERVER.SET_CLIENT_CHOICE, (res) => {
                const {ticket, optionIndex, votes} = res;
                poll.voteOption(optionIndex, votes, ticket);
                setCurrentVotes(poll.voters.size);
                setPoll(poll);
            });
    }

    return <PollContext.Provider 
        value={{
            poll,
            setPoll,
            activeStatus,
            setActiveStatus,
            isResults,
            setIsResults,
            question,
            setQuestion,
            options,
            setOptions,
            isEditPoll,
            setEditPoll,
            totalVoters,
            currentVotes,
        }} {...props}/>;
}


export const usePoll = () => useContext(PollContext);

export default PollProvider;