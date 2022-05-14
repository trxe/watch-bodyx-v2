import { useEffect, useRef, useState } from "react";
import { usePoll } from "../context/poll.context";
import { useSockets } from "../context/socket.context";
import { AiOutlineCheck, AiOutlineClose, AiFillEdit, AiFillDelete } from "react-icons/ai"
import { MdOutlinePoll } from "react-icons/md"
import dashboard from "../styles/Dashboard.module.css"
import styles from "../styles/Poll.module.css"
import Modal from "../utils/modal";
import PollBar from "../utils/pollbar";
import EVENTS from "../config/events";
import { classList } from "../utils/utils";

const Field = ({index, type, placeholder, startEdit, editing, text, cancelling, saving, deleting}) => {
    const [isEdit, setEdit] = useState(startEdit);
    const textRef = useRef(null);

    // the function passed in must take in the textRef as input
    const addToggle = (fn?: Function) => () => {
        if (textRef.current != null) textRef.current.value = textRef.current.value.trim();
        if (fn != null) fn(textRef, index);
        setEdit(!isEdit);
    }

    return <div className={`${styles.field} ${type}`}>
        <div className={`${styles.fieldText}`}>
            {isEdit && <input ref={textRef} defaultValue={text} placeholder={placeholder}/>}
            {!isEdit && (text || <em>{placeholder}</em>)}
        </div>
        {!isEdit && <button onClick={addToggle(editing)}><AiFillEdit/></button>}
        {isEdit && <button onClick={addToggle(saving)}><AiOutlineCheck/></button>}
        {!isEdit && <button onClick={() => deleting(textRef, index)} disabled={!deleting}><AiFillDelete/></button>}
        {isEdit && <button onClick={addToggle(cancelling)}><AiOutlineClose/></button>}
    </div>
}

export const PollViewContainer = ({isPreview, label}) => {
    const {poll, isResults, currentVotes, totalVoters} = usePoll();
    const {socket, user, setNotif} = useSockets();
    const [selected, setSelected] = useState(null);
    const [vote, setVote] = useState(null);

    useEffect(() => {
        if (!socket) return;
        socket.emit(EVENTS.CLIENT.CHECK_VOTE, {ticket: user.ticket}, (res) => {
            if (res && res.messageType === 'success') {
                const optionIndex = JSON.parse(res.message);
                setVote(optionIndex);
                setSelected(optionIndex);
            }
        })
    }, []);

    const handleSelect = (event) => {
        const s: number = parseInt(event.target.value, 10);
        setSelected(s);
    }

    const submit = () => {
        if (isPreview) return;
        if (user.isAdmin) return;
        const request = {ticket: user.ticket, optionIndex: selected};
        socket.emit(EVENTS.CLIENT.SEND_CLIENT_CHOICE, request, (res) => {
            if (res && res.messageType === 'success') setVote(selected);
            else if (res && res.messageType === 'error') setNotif(res);
        });
    }

    const openPoll = () => {
        if (location.hash !== '#poll') location.hash = '#poll';
        else location.hash = '';
    }

    console.log('curr votes', currentVotes, poll.voters);

    return <div>
        <button onClick={openPoll}>{label}</button>
        <Modal id="poll" width={'60%'}>
            <h3>{poll != null && poll.question} {user != null && user.isAdmin && `[Votes: ${currentVotes}/${totalVoters}]`}</h3>
            {(isResults || user != null && user.isAdmin) && 
                poll.options.map((option, index) => <PollBar key={index} index={index} option={option.label} value={option.votes} maxValue={currentVotes} 
                    handleSelect={null} selected={selected}/>)}
            {!isResults && vote != null && 
                poll.options.map((option, index) => <PollBar key={index} index={index} option={option.label} 
                    handleSelect={null} selected={selected}/>)}
            {!isResults && vote == null && user!= null && !user.isAdmin && 
                poll.options.map((option, index) => <PollBar key={index} index={index} option={option.label} 
                    handleSelect={handleSelect} selected={selected}/>)}
            <button disabled={vote != null} onClick={submit}>Vote</button>
            <a href="#" title="Close" className={styles.closeModal}>Close</a>
        </Modal>
    </div>
}

const PollSettingsContainer = (props) => {
    const {poll, setPoll, activeStatus, isResults, question, setQuestion, options, setOptions, isEditPoll, setEditPoll, currentVotes, totalVoters} = usePoll();
    const {socket, setNotif, user} = useSockets();
    const [isAdding, setAdding] = useState(false);

    const newPoll = () => {
        setEditPoll(true);
        socket.emit(EVENTS.CLIENT.CREATE_POLL, {}, (res) => {
            setEditPoll(false);
            if (res && res.messageType === 'error') {
                setNotif(res);
            }
        });
    }

    // toggle poll 
    const togglePoll = () => {
        // to prevent accidental updates
        setEditPoll(true);
        socket.emit(EVENTS.CLIENT.ADMIN_TOGGLE_POLL_STATUS, {isActive: !activeStatus}, 
            (res) => {
                setEditPoll(false);
                if (res && res.messageType === 'error') {
                    setNotif(res);
                }
            });
    }

    //  editing the question
    const editQuestion = (textRef, index) => {
        setEditPoll(false);
        const prevQn = poll.question;
        poll.question = textRef.current.value;
        setQuestion(poll.question);
        setPoll(poll);
        // send to server
        socket.emit(EVENTS.CLIENT.UPDATE_POLL, {question: poll.question, options: poll.options}, (res) => {
            console.log('edited question', poll.question);
            if (res != null && res.messageType === 'error') {
                console.log('error and revert')
                setNotif(res);
                setQuestion(prevQn);
            }
        });
    }

    // send to the poll
    const createNewOption = (textRef, index: number) => {
        setAdding(false);
        if (!textRef.current.value || textRef.current.value.length == 0) return;
        const prevOptions = [...poll.options];
        poll.addOption(textRef.current.value);
        setOptions(poll.options);
        setPoll(poll);
        // send to server
        socket.emit(EVENTS.CLIENT.UPDATE_POLL, {question: poll.question, options: poll.options}, (res) => {
            setEditPoll(false);
            if (textRef.current && textRef.current.value.length != 0) textRef.current.value = '';
            // there is an issue with poll, which is that it's values aren't updating
            // considering removing the poll class
            if (res != null && res.messageType === 'error') {
                console.log('error and revert')
                setNotif(res);
                setOptions(prevOptions);
            }
        });
    }

    // edit poll option
    const editOption = (textRef, index: number) => {
        setEditPoll(false);
        console.log('edit', index);
        if (index >= poll.options.length || index < 0) return;
        const prevOptions = [...poll.options];
        poll.editOption(textRef.current.value, index);
        console.log('post-edit', poll.options);
        // send to server
        setOptions([...poll.options]);
        setPoll(poll);
        socket.emit(EVENTS.CLIENT.UPDATE_POLL, {question: poll.question, options: poll.options}, (res) => {
            if (textRef.current && textRef.current.value.length != 0) textRef.current.value = '';
            console.log('edited options', poll.options);
            if (res != null && res.messageType === 'error') {
                console.log('error and revert')
                setNotif(res);
                setOptions(prevOptions);
            }
        });
    }

    // delete poll option
    const deleteOption = (textRef, index: number) => {
        setEditPoll(false);
        console.log('delete', textRef.current, index);
        if (index >= poll.options.length || index < 0) return;
        const prevOptions = [...poll.options];
        poll.removeOption(index);
        console.log('post-delete', poll.options);
        // send to server
        setOptions([...poll.options]);
        socket.emit(EVENTS.CLIENT.UPDATE_POLL, {question: poll.question, options: poll.options}, (res) => {
            if (textRef.current && textRef.current.value.length != 0) textRef.current.value = '';
            console.log('deleted options', poll.options);
            if (res != null && res.messageType === 'error') {
                console.log('error and revert')
                setNotif(res);
                setOptions(prevOptions);
            }
        });
    }

    return <div {...props}>
        <div className={dashboard.containerHeader}>
            <MdOutlinePoll />
            <div className={dashboard.containerTitle}>POLL</div>
            <div className={styles.voteCount}>{currentVotes}/{totalVoters} voted</div>
            <PollViewContainer label={'Preview'} isPreview={user != null && user.isAdmin}/>
            <button onClick={newPoll} disabled={isEditPoll}>Reset</button>
        </div>
        <div className={dashboard.containerContent}>
            <Field type={styles.pollTitle} 
                index={0}
                startEdit={false}
                placeholder={'Insert Title'} 
                editing={() => setEditPoll(true)}
                cancelling={() => setEditPoll(false)}
                saving={editQuestion}
                deleting={null}
                text={question} />
            {options.map((option, index) => 
                <Field type={styles.pollOption} 
                    key={index}
                    index={index}
                    startEdit={false}
                    placeholder={'Edit option'} 
                    editing={() => setEditPoll(true)}
                    cancelling={() => setEditPoll(false)}
                    saving={editOption}
                    deleting={deleteOption}
                    text={option.label} />
            )}
            {isAdding && 
                <Field type={styles.pollOption} 
                    index={poll.options.length}
                    startEdit={true}
                    placeholder={'New option'} 
                    editing={() => setAdding(true)}
                    cancelling={() => setAdding(false)}
                    saving={createNewOption}
                    deleting={null}
                    text={null} />
            }
            {!isAdding && <div onClick={() => {setAdding(true); setEditPoll(true);}} 
                className={`${styles.field} ${styles.addOption}`}>
                Add option</div>}
        </div>
    </div>;

}

export default PollSettingsContainer;