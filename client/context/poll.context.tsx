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

    constructor(question: string, options?: Array<Option>) {
        this.question = question;
        this.options = !options ? [] : options;
    }

    public addOption(label: string, atIndex?: number) {
        // if votes are already present, no more changes to the poll options are allowed.
        if (this.voters.size > 0) return;
        const option: Option = {label, votes: 0};
        if (atIndex != null && atIndex < this.options.length) {
            if (atIndex >= this.options.length || atIndex < 0) return null;
            const after = this.options.slice(atIndex);
            this.options = this.options.slice(0, atIndex).concat([option]).concat(after);
        }
        this.options = this.options.concat([option]);
    }

    public removeOption(optionIndex: number) {
        // if votes are already present, no more changes to the poll options are allowed.
        if (this.voters.size > 0) return;
        if (optionIndex >= this.options.length || optionIndex < 0) return null;
        return this.options.splice(optionIndex, 1);
    }

    public voteOption(optionIndex: number, ticket: string) {
        if (this.voters.has(ticket)) return;
        if (optionIndex >= this.options.length || optionIndex < 0) return;
        const option: Option = this.options[optionIndex];
        this.options[optionIndex] = {...option, votes: option.votes+1};
        this.voters.set(ticket, option.label);
    }
}

interface IPollContext {
    question: string
    options: Array<Option>
    isActive: boolean
    voters?: Map<string, string> // user ticket, option label
    totalVoters: number
}

const PollContext = createContext<IPollContext>({
    question: '',
    options: [],
    isActive: false,
    totalVoters: 0
});

const PollProvider = (props: any) => {
    const poll = new Poll('');
    const {socket, show} = useSockets();
    const [totalVoters, setTotalVoters] = useState(0);

    useEffect(() => {
        if (!show) return;
        setTotalVoters(show.attendees.size);
    }, [show])

    if (socket != null) {
        // socket.off(EVENTS.SERVER.)
    }

    return <PollContext.Provider
        value={{
            question: poll.question, 
            options: poll.options,
        }} {...props} />
}

export const usePoll = () => useContext(PollContext);

export default PollProvider;