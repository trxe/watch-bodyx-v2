import { createContext, useContext, useEffect, useState } from "react";
import EVENTS from "../config/events";
import { useSockets } from "./socket.context";

interface Option {
    label: string
    votes: number
}

class Poll {
    question: string
    options: Array<Option>
    isActive: boolean

    // admins only update the following
    voters: Map<string, string> // user ticket, option label

    constructor(question?: string, options?: Array<Option>) {
        this.question = question;
        this.options = !options ? [] : options;
        this.isActive = false;
        this.voters = new Map<string, string>();
    }

    public setOptions(options: Array<Option>) {
        if (this.isActive) return;
        this.options = options;
    }

    public addOption(label: string) {
        if (this.isActive) return;
        // if votes are already present, no more changes to the poll options are allowed.
        if (this.voters.size > 0) return;
        const option: Option = {label, votes: 0};
        this.options.push(option);
    }

    public editOption(label: string, atIndex: number) {
        if (this.isActive) return;
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
        if (this.isActive) return;
        // if votes are already present, no more changes to the poll options are allowed.
        if (this.voters.size > 0) return;
        if (atIndex >= this.options.length || atIndex < 0) return null;
        return this.options.splice(atIndex, 1);
    }

    public voteOption(atIndex: number, ticket: string) {
        if (this.voters.has(ticket)) return;
        if (atIndex >= this.options.length || atIndex < 0) return;
        const option: Option = this.options[atIndex];
        this.options[atIndex] = {...option, votes: option.votes+1};
        this.voters.set(ticket, option.label);
    }
}

interface IPollContext {
    poll: Poll
    setPoll: Function
    question: string
    setQuestion: Function
    options: Array<Option>
    setOptions: Function
    totalVoters: number
}

const PollContext = createContext<IPollContext>({
    poll: new Poll(),
    setPoll: () => console.log('dummy qn'),
    question: null,
    setQuestion: () => console.log('dummy qn'),
    options: [],
    setOptions: () => console.log('dummy log'),
    totalVoters: 0
});

const PollProvider = (props: any) => {
    const [poll, setPoll] = useState(new Poll());
    const [totalVoters, setTotalVoters] = useState(0);
    const [question, setQuestion] = useState(poll.question);
    const [options, setOptions] = useState(poll.options);
    const {socket, show} = useSockets();

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
                const {question, options, voters} = res;
                if (question != null) poll.question = question;
                setQuestion(poll.question);
                if (options !=null) poll.setOptions(options);
                setOptions(poll.options);
            });
    }

    return <PollContext.Provider 
        value={{
            poll,
            setPoll,
            question,
            setQuestion,
            options,
            setOptions,
            totalVoters,
        }} {...props}/>;
}


export const usePoll = () => useContext(PollContext);

export default PollProvider;